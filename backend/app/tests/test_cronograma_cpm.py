from app.services.cronograma_cpm import ActividadCpm, CriticalPathEngine, DependenciaCpm


def test_red_lineal_tiene_duracion_y_ruta_critica_correctas():
    engine = CriticalPathEngine()
    result = engine.calcular(
        {
            "A": ActividadCpm(id="A", nombre="A", duracion=3),
            "B": ActividadCpm(id="B", nombre="B", duracion=4, predecesores=[DependenciaCpm("A")]),
            "C": ActividadCpm(id="C", nombre="C", duracion=2, predecesores=[DependenciaCpm("B")]),
        }
    )

    assert result.duracion_total == 9
    assert result.rutas_criticas == [["A", "B", "C"]]
    assert result.actividades["A"].holgura_total == 0
    assert result.actividades["B"].holgura_total == 0
    assert result.actividades["C"].holgura_total == 0


def test_lag_fs_desplaza_inicio_temprano():
    engine = CriticalPathEngine()
    result = engine.calcular(
        {
            "A": ActividadCpm(id="A", nombre="A", duracion=3),
            "B": ActividadCpm(id="B", nombre="B", duracion=4, predecesores=[DependenciaCpm("A", "FS", 3)]),
        }
    )

    assert result.duracion_total == 10
    assert result.actividades["B"].es == 6
    assert result.actividades["B"].ef == 10


def test_holgura_libre_es_menor_o_igual_a_holgura_total():
    engine = CriticalPathEngine()
    result = engine.calcular(
        {
            "A": ActividadCpm(id="A", nombre="A", duracion=5),
            "B": ActividadCpm(id="B", nombre="B", duracion=8, predecesores=[DependenciaCpm("A")]),
            "C": ActividadCpm(id="C", nombre="C", duracion=4, predecesores=[DependenciaCpm("A")]),
            "D": ActividadCpm(id="D", nombre="D", duracion=3, predecesores=[DependenciaCpm("C")]),
            "E": ActividadCpm(
                id="E",
                nombre="E",
                duracion=5,
                predecesores=[DependenciaCpm("B"), DependenciaCpm("D")],
            ),
        }
    )

    actividad_c = result.actividades["C"]
    actividad_d = result.actividades["D"]

    assert actividad_c.holgura_total == 1
    assert actividad_c.holgura_libre == 0
    assert actividad_d.holgura_total == 1
    assert actividad_d.holgura_libre == 1
    assert actividad_c.holgura_libre <= actividad_c.holgura_total
    assert actividad_d.holgura_libre <= actividad_d.holgura_total


def test_detecta_multiples_rutas_criticas():
    engine = CriticalPathEngine()
    result = engine.calcular(
        {
            "A": ActividadCpm(id="A", nombre="A", duracion=5),
            "B": ActividadCpm(id="B", nombre="B", duracion=8, predecesores=[DependenciaCpm("A")]),
            "C": ActividadCpm(id="C", nombre="C", duracion=6),
            "D": ActividadCpm(id="D", nombre="D", duracion=7, predecesores=[DependenciaCpm("C")]),
        }
    )

    assert result.duracion_total == 13
    assert sorted(result.rutas_criticas) == [["A", "B"], ["C", "D"]]


def test_restriccion_snet_desplaza_inicio():
    engine = CriticalPathEngine()
    result = engine.calcular(
        {
            "A": ActividadCpm(
                id="A",
                nombre="A",
                duracion=3,
                restriccion_tipo="SNET",
                restriccion_valor=5,
            )
        }
    )

    activity = result.actividades["A"]
    assert activity.es == 5
    assert activity.ef == 8
    assert activity.ls == 5
    assert activity.lf == 8


def test_holgura_negativa_generada_por_fnlt():
    engine = CriticalPathEngine()
    result = engine.calcular(
        {
            "A": ActividadCpm(
                id="A",
                nombre="A",
                duracion=5,
                restriccion_tipo="FNLT",
                restriccion_valor=3,
            )
        }
    )

    activity = result.actividades["A"]
    assert result.tiene_holgura_negativa is True
    assert activity.holgura_total < 0
    assert any("holgura negativa" in warning.lower() for warning in result.advertencias)


def test_hito_conserva_fechas_iguales():
    engine = CriticalPathEngine()
    result = engine.calcular(
        {
            "A": ActividadCpm(id="A", nombre="A", duracion=0),
            "B": ActividadCpm(id="B", nombre="B", duracion=4, predecesores=[DependenciaCpm("A")]),
        }
    )

    milestone = result.actividades["A"]
    assert milestone.es == 0
    assert milestone.ef == 0
    assert milestone.ls == 0
    assert milestone.lf == 0


def test_ciclo_lanza_error_descriptivo():
    engine = CriticalPathEngine()
    activities = {
        "A": ActividadCpm(id="A", nombre="A", duracion=1, predecesores=[DependenciaCpm("C")]),
        "B": ActividadCpm(id="B", nombre="B", duracion=1, predecesores=[DependenciaCpm("A")]),
        "C": ActividadCpm(id="C", nombre="C", duracion=1, predecesores=[DependenciaCpm("B")]),
    }

    try:
        engine.calcular(activities)
    except ValueError as exc:
        assert "ciclo" in str(exc).lower()
    else:
        raise AssertionError("Se esperaba ValueError por ciclo en la red")


def test_turno_nocturno_aumenta_duracion_efectiva():
    engine = CriticalPathEngine()
    result = engine.calcular(
        {
            "A": ActividadCpm(id="A", nombre="A", duracion=8, turno="nocturno")
        }
    )

    activity = result.actividades["A"]
    assert activity.duracion_efectiva == 10
    assert activity.ef == 10
