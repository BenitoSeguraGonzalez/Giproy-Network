from pathlib import Path


def test_bim_4d_migration_is_additive_and_chained():
    path = Path(__file__).parents[2] / "alembic" / "versions" / "de2011a1b2c3_bim_4d_links.py"
    source = path.read_text(encoding="utf-8")
    assert 'down_revision = "de2010a1b2c3"' in source
    assert '"bim_4d_activity_snapshots"' in source
    assert '"bim_4d_link_proposals"' in source
    assert "drop_column" not in source and "alter_column" not in source

    progress_path = Path(__file__).parents[2] / "alembic" / "versions" / "de2012a1b2c3_bim_4d_progress.py"
    progress_source = progress_path.read_text(encoding="utf-8")
    assert 'down_revision = "de2011a1b2c3"' in progress_source
    assert '"bim_4d_progress_snapshots"' in progress_source
    assert "alter_column" not in progress_source

    baseline_path = Path(__file__).parents[2] / "alembic" / "versions" / "de2013a1b2c3_bim_4d_baselines.py"
    baseline_source = baseline_path.read_text(encoding="utf-8")
    assert 'down_revision = "de2012a1b2c3"' in baseline_source
    assert '"bim_4d_baselines"' in baseline_source
    assert '"bim_4d_dependency_snapshots"' in baseline_source
    assert "alter_column" not in baseline_source
