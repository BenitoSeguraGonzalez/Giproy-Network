object DM_OnLine: TDM_OnLine
  Height = 720
  Width = 960
  PixelsPerInch = 144
  object SMTP_1: TIdSMTP
    SASLMechanisms = <>
    Left = 324
    Top = 60
  end
  object MailMessage_1: TIdMessage
    AttachmentEncoding = 'UUE'
    BccList = <>
    CCList = <>
    Encoding = meDefault
    FromList = <
      item
      end>
    Recipients = <>
    ReplyTo = <>
    ConvertPreamble = True
    Left = 324
    Top = 180
  end
  object SalsaEnc_1: TSalsaEncryption
    Version = '4.3.3.0'
    Left = 432
    Top = 60
  end
end
