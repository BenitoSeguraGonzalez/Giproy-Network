param(
    [int]$Port = 45731
)

$ErrorActionPreference = "Stop"

function Get-BridgeVersion {
    return "0.1.0"
}

function Add-CorsHeaders {
    param($Response, [string]$Origin)
    if ([string]::IsNullOrWhiteSpace($Origin)) {
        $Response.Headers["Access-Control-Allow-Origin"] = "*"
    } else {
        $Response.Headers["Access-Control-Allow-Origin"] = $Origin
        $Response.Headers["Vary"] = "Origin"
    }
    $Response.Headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    $Response.Headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
}

function Write-JsonResponse {
    param(
        $Context,
        [int]$StatusCode,
        $Payload
    )

    $response = $Context.Response
    Add-CorsHeaders -Response $response -Origin $Context.Request.Headers["Origin"]
    $response.StatusCode = $StatusCode
    $response.ContentType = "application/json; charset=utf-8"
    $json = $Payload | ConvertTo-Json -Depth 8 -Compress
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    $response.OutputStream.Write($bytes, 0, $bytes.Length)
    $response.OutputStream.Close()
}

function Resolve-ProjectPath {
    $registryLocations = @(
        "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\WINPROJ.EXE",
        "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\WINPROJ.EXE"
    )

    foreach ($location in $registryLocations) {
        try {
            $value = (Get-ItemProperty -Path $location -ErrorAction Stop).'(default)'
            if ($value -and (Test-Path $value)) {
                return $value
            }
        } catch {
        }
    }

    $candidates = @(
        "C:\Program Files\Microsoft Office\root\Office16\WINPROJ.EXE",
        "C:\Program Files (x86)\Microsoft Office\root\Office16\WINPROJ.EXE",
        "C:\Program Files\Microsoft Office\Office16\WINPROJ.EXE",
        "C:\Program Files (x86)\Microsoft Office\Office16\WINPROJ.EXE"
    )
    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) {
            return $candidate
        }
    }
    return $null
}

function Get-ProjectStatus {
    $projectPath = Resolve-ProjectPath
    if (-not $projectPath) {
        return @{
            installed = $false
            ready = $false
            reason = "No se detectó Microsoft Project en esta máquina."
            projectPath = $null
        }
    }

    $app = $null
    try {
        $app = New-Object -ComObject MSProject.Application
        try { $app.Visible = $false } catch {}
        return @{
            installed = $true
            ready = $true
            reason = $null
            projectPath = $projectPath
        }
    } catch {
        return @{
            installed = $true
            ready = $false
            reason = "Microsoft Project está instalado pero no responde desde la sesión interactiva actual: $($_.Exception.Message)"
            projectPath = $projectPath
        }
    } finally {
        if ($app -ne $null) {
            try { $app.Quit() } catch {}
        }
    }
}

function Get-ExportDirectory {
    $path = Join-Path $env:LOCALAPPDATA "GiProy\ProjectBridge\Exports"
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
    }
    return $path
}

function Get-SafeFileBaseName {
    param([string]$Value)
    $fallback = "CronogramaTrabajo"
    $baseName = if ([string]::IsNullOrWhiteSpace($Value)) { $fallback } else { $Value.Trim() }
    foreach ($invalid in [IO.Path]::GetInvalidFileNameChars()) {
        $baseName = $baseName.Replace([string]$invalid, "_")
    }
    return $baseName
}

function Open-ProjectFromXmlPayload {
    param(
        [string]$XmlBase64,
        [string]$FileName
    )

    if ([string]::IsNullOrWhiteSpace($XmlBase64)) {
        throw "No se recibió contenido XML para Microsoft Project."
    }

    $status = Get-ProjectStatus
    if (-not $status.ready) {
        throw ($status.reason ?? "Microsoft Project no está disponible.")
    }

    $exportDir = Get-ExportDirectory
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $safeName = Get-SafeFileBaseName -Value $FileName
    $xmlPath = Join-Path $exportDir "$safeName`_$timestamp.xml"
    $mppPath = Join-Path $exportDir "$safeName`_$timestamp.mpp"

    $bytes = [Convert]::FromBase64String($XmlBase64)
    [IO.File]::WriteAllBytes($xmlPath, $bytes)

    $app = $null
    try {
        $app = New-Object -ComObject MSProject.Application
        $app.Visible = $false
        $app.DisplayAlerts = $false
        $app.FileOpen($xmlPath)
        $app.FileSaveAs($mppPath)
        if (-not (Test-Path $mppPath)) {
            throw "Microsoft Project no generó el archivo .mpp esperado."
        }
        $app.Visible = $true
        $app.DisplayAlerts = $true
        return @{
            ok = $true
            mppPath = $mppPath
            xmlPath = $xmlPath
            fileName = [IO.Path]::GetFileName($mppPath)
        }
    } finally {
        $app = $null
    }
}

function Read-RequestBodyText {
    param($Request)
    $reader = New-Object System.IO.StreamReader($Request.InputStream, $Request.ContentEncoding)
    try {
        return $reader.ReadToEnd()
    } finally {
        $reader.Close()
    }
}

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $path = $request.Url.AbsolutePath.TrimEnd("/")
        if ([string]::IsNullOrWhiteSpace($path)) {
            $path = "/"
        }

        if ($request.HttpMethod -eq "OPTIONS") {
            Add-CorsHeaders -Response $context.Response -Origin $request.Headers["Origin"]
            $context.Response.StatusCode = 204
            $context.Response.OutputStream.Close()
            continue
        }

        try {
            switch ("$($request.HttpMethod) $path") {
                "GET /health" {
                    Write-JsonResponse -Context $context -StatusCode 200 -Payload @{
                        ok = $true
                        service = "GiProy Project Bridge"
                        version = Get-BridgeVersion
                    }
                }
                "GET /status" {
                    $status = Get-ProjectStatus
                    Write-JsonResponse -Context $context -StatusCode 200 -Payload @{
                        ok = $true
                        service = "GiProy Project Bridge"
                        version = Get-BridgeVersion
                        projectInstalled = $status.installed
                        ready = $status.ready
                        reason = $status.reason
                        projectPath = $status.projectPath
                        port = $Port
                    }
                }
                "POST /open-msproject-from-xml" {
                    $bodyText = Read-RequestBodyText -Request $request
                    $payload = if ([string]::IsNullOrWhiteSpace($bodyText)) { @{} } else { $bodyText | ConvertFrom-Json }
                    $result = Open-ProjectFromXmlPayload -XmlBase64 $payload.xmlBase64 -FileName $payload.fileName
                    Write-JsonResponse -Context $context -StatusCode 200 -Payload $result
                }
                default {
                    Write-JsonResponse -Context $context -StatusCode 404 -Payload @{
                        ok = $false
                        detail = "Ruta no soportada por GiProy Project Bridge."
                    }
                }
            }
        } catch {
            Write-JsonResponse -Context $context -StatusCode 500 -Payload @{
                ok = $false
                detail = $_.Exception.Message
            }
        }
    }
} finally {
    $listener.Stop()
    $listener.Close()
}
