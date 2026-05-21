from unittest.mock import Mock, patch

from app.repositories.cronograma_trabajo import CronogramaTrabajoRepository


def test_update_marks_schedule_data_as_modified():
    repo = CronogramaTrabajoRepository()
    db = Mock()
    db_obj = Mock()

    with patch("app.repositories.cronograma_trabajo.flag_modified") as flag_modified_mock:
        repo.update(
            db,
            db_obj,
            {
                "schedule_data": {"76": {"predecessors": [49]}},
                "updated_at": None,
            },
        )

    flag_modified_mock.assert_called_once_with(db_obj, "schedule_data")
    db.add.assert_called_once_with(db_obj)
    db.commit.assert_called_once()
    db.refresh.assert_called_once_with(db_obj)
