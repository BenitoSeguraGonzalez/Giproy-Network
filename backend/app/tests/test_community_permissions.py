from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.api.endpoints import community
from app.models.community import (
    CommunityAttachment,
    CommunityAdminAlert,
    CommunityDmThread,
    CommunityPost,
    CommunityPostReply,
    CommunitySanction,
    CommunitySanctionAppeal,
    CommunityTopic,
    CommunityTopicMember,
)
from app.models.empresa import Empresa
from app.models.usuario import Usuario
from app.schemas.community import CommunitySanctionCreateRequest


@pytest.fixture
def sample_empresa_two(db):
    empresa = Empresa(
        nombre="Empresa Secundaria",
        ruc="1234567890002",
        proy_prefijo="TWO",
        proy_periodo="2026",
        proy_secuencial=1,
        proy_secuencial_size=3,
    )
    db.add(empresa)
    db.commit()
    db.refresh(empresa)
    return empresa


@pytest.fixture
def community_users(db, sample_empresa, sample_empresa_two):
    superadmin = Usuario(
        email="superadmin@test.local",
        hashed_password="x",
        nombre_completo="Super Admin",
        rol="superadministrador",
        activo=True,
        empresa_id=sample_empresa.id,
    )
    admin_company_one = Usuario(
        email="admin1@test.local",
        hashed_password="x",
        nombre_completo="Admin Uno",
        rol="administrador",
        activo=True,
        empresa_id=sample_empresa.id,
    )
    admin_company_two = Usuario(
        email="admin2@test.local",
        hashed_password="x",
        nombre_completo="Admin Dos",
        rol="administrador",
        activo=True,
        empresa_id=sample_empresa_two.id,
    )
    user_company_one = Usuario(
        email="user1@test.local",
        hashed_password="x",
        nombre_completo="Usuario Uno",
        rol="usuario",
        activo=True,
        empresa_id=sample_empresa.id,
    )
    community_user_company_one = Usuario(
        email="community1@test.local",
        hashed_password="x",
        nombre_completo="Usuario Comunidad Uno",
        rol="usuario_comunidad",
        activo=True,
        empresa_id=sample_empresa.id,
    )
    user_company_two = Usuario(
        email="user2@test.local",
        hashed_password="x",
        nombre_completo="Usuario Dos",
        rol="usuario",
        activo=True,
        empresa_id=sample_empresa_two.id,
    )
    db.add_all(
        [
            superadmin,
            admin_company_one,
            admin_company_two,
            user_company_one,
            community_user_company_one,
            user_company_two,
        ]
    )
    db.commit()
    for item in [
        superadmin,
        admin_company_one,
        admin_company_two,
        user_company_one,
        community_user_company_one,
        user_company_two,
    ]:
        db.refresh(item)
    return {
        "superadmin": superadmin,
        "admin_company_one": admin_company_one,
        "admin_company_two": admin_company_two,
        "user_company_one": user_company_one,
        "community_user_company_one": community_user_company_one,
        "user_company_two": user_company_two,
    }


def test_company_admin_can_only_moderate_internal_posts_of_active_company(db, sample_empresa, sample_empresa_two, community_users):
    post_internal_same_company = CommunityPost(
        scope="interno_empresa",
        status="publicado",
        title="Interno empresa 1",
        body="Contenido interno",
        author_user_id=community_users["user_company_one"].id,
        empresa_id=sample_empresa.id,
        target_empresa_id=sample_empresa.id,
    )
    post_internal_other_company = CommunityPost(
        scope="interno_empresa",
        status="publicado",
        title="Interno empresa 2",
        body="Contenido interno",
        author_user_id=community_users["user_company_two"].id,
        empresa_id=sample_empresa_two.id,
        target_empresa_id=sample_empresa_two.id,
    )
    post_public = CommunityPost(
        scope="publico",
        status="publicado",
        title="Publico",
        body="Contenido publico",
        author_user_id=community_users["user_company_one"].id,
        empresa_id=sample_empresa.id,
        target_empresa_id=None,
    )

    assert community._can_moderate_post(post_internal_same_company, community_users["admin_company_one"], sample_empresa.id) is True
    assert community._can_moderate_post(post_internal_other_company, community_users["admin_company_one"], sample_empresa.id) is False
    assert community._can_moderate_post(post_public, community_users["admin_company_one"], sample_empresa.id) is False
    assert community._can_moderate_post(post_public, community_users["superadmin"], sample_empresa.id) is True


def test_restricted_topic_visibility_respects_membership_and_company(db, sample_empresa, sample_empresa_two, community_users):
    topic = CommunityTopic(
        scope="interno_empresa",
        nombre="Tema restringido",
        descripcion="Solo miembros",
        is_restricted=True,
        is_active=True,
        target_empresa_id=sample_empresa.id,
        created_by_user_id=community_users["admin_company_one"].id,
    )
    db.add(topic)
    db.flush()
    db.add(
        CommunityTopicMember(
            topic_id=topic.id,
            user_id=community_users["community_user_company_one"].id,
            added_by_user_id=community_users["admin_company_one"].id,
        )
    )
    db.commit()
    db.refresh(topic)

    assert community._can_access_topic(topic, community_users["community_user_company_one"]) is True
    assert community._can_access_topic(topic, community_users["user_company_one"]) is False
    assert community._can_access_topic(topic, community_users["user_company_two"]) is False
    assert community._can_access_topic(topic, community_users["superadmin"]) is True


def test_company_admin_cannot_issue_global_or_foreign_company_sanctions(sample_empresa, sample_empresa_two, community_users):
    global_payload = CommunitySanctionCreateRequest(
        target_user_id=community_users["user_company_one"].id,
        sanction_type="bloqueo_publico",
        scope="publico",
        reason="Bloqueo global no permitido",
    )
    with pytest.raises(HTTPException, match="solo puede sancionar el foro interno"):
        community._ensure_can_issue_sanction(
            community_users["admin_company_one"],
            community_users["user_company_one"],
            global_payload,
            sample_empresa.id,
        )

    foreign_company_payload = CommunitySanctionCreateRequest(
        target_user_id=community_users["user_company_two"].id,
        sanction_type="bloqueo_interno",
        scope="interno_empresa",
        reason="Bloqueo cruzado no permitido",
        target_empresa_id=sample_empresa_two.id,
    )
    with pytest.raises(HTTPException, match="Solo puede sancionar usuarios de su empresa activa"):
        community._ensure_can_issue_sanction(
            community_users["admin_company_one"],
            community_users["user_company_two"],
            foreign_company_payload,
            sample_empresa.id,
        )


def test_non_admin_cannot_issue_community_sanctions(sample_empresa, community_users):
    payload = CommunitySanctionCreateRequest(
        target_user_id=community_users["community_user_company_one"].id,
        sanction_type="bloqueo_interno",
        scope="interno_empresa",
        reason="Sin permisos de sancion",
        target_empresa_id=sample_empresa.id,
    )
    with pytest.raises(HTTPException, match="No tiene permisos para sancionar"):
        community._ensure_can_issue_sanction(
            community_users["user_company_one"],
            community_users["community_user_company_one"],
            payload,
            sample_empresa.id,
        )


def test_internal_sanction_only_blocks_target_company(db, sample_empresa, sample_empresa_two, community_users):
    internal_block = CommunitySanction(
        target_user_id=community_users["user_company_one"].id,
        issued_by_user_id=community_users["admin_company_one"].id,
        sanction_type="bloqueo_interno",
        scope="interno_empresa",
        target_empresa_id=sample_empresa.id,
        reason="Bloqueo interno empresa uno",
        is_active=True,
        expires_at=datetime.now(timezone.utc) + timedelta(days=3),
    )
    db.add(internal_block)
    db.commit()

    with pytest.raises(HTTPException, match="participación interna en esta empresa"):
        community._ensure_not_sanctioned(
            db,
            community_users["user_company_one"],
            sample_empresa.id,
            "interno_empresa",
        )

    community._ensure_not_sanctioned(
        db,
        community_users["user_company_one"],
        sample_empresa_two.id,
        "interno_empresa",
    )


def test_public_link_infraction_escalates_to_global_ban(db, sample_empresa, community_users, monkeypatch):
    monkeypatch.setattr(community, "record_audit_event", lambda *args, **kwargs: None)

    user = community_users["user_company_one"]
    for expected_type in ["bloqueo_publico", "bloqueo_publico", "bloqueo_comunidad"]:
        with pytest.raises(HTTPException, match="No se permiten links en la Comunidad Pública"):
            community._apply_public_link_infraction(
                db,
                current_user=user,
                active_company_id=sample_empresa.id,
                body_text="Visite https://example.com ahora",
                content_type="post",
            )

        latest_sanction = (
            db.query(CommunitySanction)
            .filter(CommunitySanction.target_user_id == user.id)
            .order_by(CommunitySanction.id.desc())
            .first()
        )
        assert latest_sanction is not None
        assert latest_sanction.sanction_type == expected_type

    assert db.query(CommunitySanction).filter(CommunitySanction.target_user_id == user.id).count() == 3
    assert db.query(community.CommunityInfraction).filter(community.CommunityInfraction.target_user_id == user.id).count() == 3
    assert db.query(community.CommunityAdminAlert).filter(community.CommunityAdminAlert.target_user_id == user.id).count() == 3


@pytest.mark.parametrize(
    ("body_text", "expected_fragment"),
    [
        ("Visite https://example.com ahora", "https://example.com"),
        ("Mira hpps:\\\\www.estoesunlink.co.uk por favor", "hpps://www.estoesunlink.co.uk"),
        ("Ruta ofuscada hxxps://portal.example.com/login", "hxxps://portal.example.com/login"),
        ("Dominio ofuscado www[.]example[.]com para revisar", "www.example.com"),
    ],
)
def test_detect_first_link_catches_obfuscated_link_variants(body_text, expected_fragment):
    detected = community._detect_first_link(body_text)
    assert detected is not None
    assert expected_fragment in detected


def test_detect_first_link_does_not_flag_plain_text_without_links():
    assert community._detect_first_link("Texto normal sin direcciones ni dominios externos.") is None


def test_extract_mention_handles_normalizes_deduplicates_and_preserves_order():
    handles = community._extract_mention_handles(
        "Hola @Usuario.Uno y @usuario.uno",
        "Revisar con @Equipo-Dos y @equipo_dos.",
    )

    assert handles == ["usuario.uno", "equipo-dos", "equipo_dos"]


def test_normalize_filename_sanitizes_unsafe_names():
    assert community._normalize_filename("  reporte final (1).pdf ") == "reporte_final_1_.pdf"
    assert community._normalize_filename("...") == "archivo"
    assert community._normalize_filename(None) == "archivo"


def test_community_user_handle_falls_back_from_alias_to_email_name_and_id():
    assert community._community_user_handle(
        SimpleNamespace(alias=" Alias Público ", email="mail@test.local", nombre_completo="Nombre", id=7)
    ) == "aliaspblico"
    assert community._community_user_handle(
        SimpleNamespace(alias="", email="usuario.test@example.com", nombre_completo="Nombre", id=8)
    ) == "usuario.test"
    assert community._community_user_handle(
        SimpleNamespace(alias="", email="", nombre_completo="Nombre Completo", id=9)
    ) == "nombrecompleto"
    assert community._community_user_handle(
        SimpleNamespace(alias="", email="", nombre_completo="", id=10)
    ) == "usuario-10"


def test_author_edit_window_accepts_naive_and_timezone_aware_dates():
    fresh_naive = (datetime.now(timezone.utc) - timedelta(minutes=1)).replace(tzinfo=None)
    old_aware = datetime.now(timezone.utc) - timedelta(minutes=31)

    assert community._is_within_author_edit_window(fresh_naive) is True
    assert community._is_within_author_edit_window(old_aware) is False
    assert community._is_within_author_edit_window(None) is False


def test_author_post_policy_blocks_other_users_deleted_posts_and_visible_replies():
    current_user = SimpleNamespace(id=10)
    fresh_post = SimpleNamespace(
        author_user_id=10,
        deleted_at=None,
        created_at=datetime.now(timezone.utc),
        replies=[],
    )
    foreign_post = SimpleNamespace(**{**fresh_post.__dict__, "author_user_id": 11})
    deleted_post = SimpleNamespace(**{**fresh_post.__dict__, "deleted_at": datetime.now(timezone.utc)})
    post_with_visible_reply = SimpleNamespace(
        **{
            **fresh_post.__dict__,
            "replies": [SimpleNamespace(deleted_at=None)],
        }
    )
    post_with_deleted_reply = SimpleNamespace(
        **{
            **fresh_post.__dict__,
            "replies": [SimpleNamespace(deleted_at=datetime.now(timezone.utc))],
        }
    )

    assert community._can_author_edit_post(fresh_post, current_user) is True
    assert community._can_author_edit_post(foreign_post, current_user) is False
    assert community._can_author_edit_post(deleted_post, current_user) is False
    assert community._can_author_delete_post(post_with_visible_reply, current_user) is False
    assert community._can_author_delete_post(post_with_deleted_reply, current_user) is True


def test_author_reply_policy_blocks_visible_child_replies():
    current_user = SimpleNamespace(id=20)
    reply = SimpleNamespace(
        id=5,
        parent_reply_id=None,
        author_user_id=20,
        deleted_at=None,
        created_at=datetime.now(timezone.utc),
    )
    visible_child = SimpleNamespace(parent_reply_id=5, deleted_at=None)
    deleted_child = SimpleNamespace(parent_reply_id=5, deleted_at=datetime.now(timezone.utc))
    unrelated_child = SimpleNamespace(parent_reply_id=99, deleted_at=None)

    assert community._can_author_edit_reply(reply, current_user) is True
    assert community._can_author_delete_reply(reply, current_user, [visible_child]) is False
    assert community._can_author_delete_reply(reply, current_user, [deleted_child, unrelated_child]) is True


def test_sanction_active_policy_handles_inactive_expired_and_naive_dates():
    now = datetime.now(timezone.utc)

    assert community._is_sanction_active(SimpleNamespace(is_active=True, expires_at=None)) is True
    assert community._is_sanction_active(
        SimpleNamespace(is_active=False, expires_at=now + timedelta(days=1))
    ) is False
    assert community._is_sanction_active(
        SimpleNamespace(is_active=True, expires_at=now - timedelta(minutes=1))
    ) is False
    assert community._is_sanction_active(
        SimpleNamespace(is_active=True, expires_at=(now + timedelta(minutes=1)).replace(tzinfo=None))
    ) is True


@pytest.mark.parametrize(
    ("sanction_types", "expected_state"),
    [
        ([], "activo"),
        (["bloqueo_dm"], "bloqueado_dm"),
        (["bloqueo_interno", "bloqueo_dm"], "bloqueado_interno"),
        (["bloqueo_publico", "bloqueo_interno"], "bloqueado_publico"),
        (["bloqueo_comunidad", "bloqueo_publico", "bloqueo_dm"], "baneado_comunidad"),
    ],
)
def test_community_state_from_sanctions_respects_severity_priority(sanction_types, expected_state):
    sanctions = [SimpleNamespace(sanction_type=sanction_type) for sanction_type in sanction_types]

    assert community._community_state_from_sanctions(sanctions) == expected_state


@pytest.mark.parametrize(
    ("role", "expected"),
    [
        ("administrador", True),
        ("superadministrador", True),
        (" usuario ", False),
        ("", False),
    ],
)
def test_can_manage_topics_depends_on_normalized_role(role, expected):
    assert community._can_manage_topics(SimpleNamespace(rol=role)) is expected


def test_can_access_topic_respects_active_company_restriction_and_membership():
    member_user = SimpleNamespace(id=10, empresa_id=1, rol="usuario")
    non_member_user = SimpleNamespace(id=11, empresa_id=1, rol="usuario")
    foreign_user = SimpleNamespace(id=12, empresa_id=2, rol="usuario")
    superadmin = SimpleNamespace(id=13, empresa_id=99, rol="superadministrador")
    member = SimpleNamespace(user_id=10)

    inactive_topic = SimpleNamespace(
        is_active=False,
        scope="publico",
        target_empresa_id=None,
        is_restricted=False,
        members=[],
    )
    open_internal_topic = SimpleNamespace(
        is_active=True,
        scope="interno_empresa",
        target_empresa_id=1,
        is_restricted=False,
        members=[],
    )
    restricted_topic = SimpleNamespace(
        is_active=True,
        scope="interno_empresa",
        target_empresa_id=1,
        is_restricted=True,
        members=[member],
    )

    assert community._can_access_topic(inactive_topic, superadmin) is False
    assert community._can_access_topic(open_internal_topic, member_user) is True
    assert community._can_access_topic(open_internal_topic, foreign_user) is False
    assert community._can_access_topic(restricted_topic, member_user) is True
    assert community._can_access_topic(restricted_topic, non_member_user) is False
    assert community._can_access_topic(restricted_topic, superadmin) is True


def test_ensure_topic_scope_reports_scope_and_company_mismatch():
    topic = SimpleNamespace(scope="interno_empresa", target_empresa_id=1)

    with pytest.raises(HTTPException, match="ámbito seleccionado"):
        community._ensure_topic_scope(topic, "publico", 1)
    with pytest.raises(HTTPException, match="empresa activa"):
        community._ensure_topic_scope(topic, "interno_empresa", 2)

    assert community._ensure_topic_scope(topic, "interno_empresa", 1) is None


def test_ensure_category_scope_reports_scope_and_company_mismatch():
    public_category = SimpleNamespace(scope="publico", target_empresa_id=None)
    internal_category = SimpleNamespace(scope="interno_empresa", target_empresa_id=1)

    assert community._ensure_category_scope(public_category, "publico", 99) is None

    with pytest.raises(HTTPException, match="ámbito seleccionado"):
        community._ensure_category_scope(internal_category, "publico", 1)
    with pytest.raises(HTTPException, match="empresa activa"):
        community._ensure_category_scope(internal_category, "interno_empresa", 2)

    assert community._ensure_category_scope(internal_category, "interno_empresa", 1) is None


def test_dm_thread_serialization_exposes_blocking_actor(db, sample_empresa, community_users):
    thread = CommunityDmThread(
        user_a_id=community_users["user_company_one"].id,
        user_b_id=community_users["community_user_company_one"].id,
        empresa_context_id=sample_empresa.id,
        blocked_at=datetime.now(timezone.utc),
        blocked_by_user_id=community_users["user_company_one"].id,
    )
    db.add(thread)
    db.commit()
    db.refresh(thread)

    serialized_for_blocker = community._serialize_dm_thread(thread, community_users["user_company_one"])
    serialized_for_counterpart = community._serialize_dm_thread(thread, community_users["community_user_company_one"])

    assert serialized_for_blocker.blocked_by_user_id == community_users["user_company_one"].id
    assert serialized_for_blocker.blocked_by_name == community_users["user_company_one"].nombre_completo
    assert serialized_for_blocker.blocked_by_me is True
    assert serialized_for_counterpart.blocked_by_me is False


def test_only_blocking_user_can_reactivate_dm_thread(db, sample_empresa, community_users):
    thread = CommunityDmThread(
        user_a_id=community_users["user_company_one"].id,
        user_b_id=community_users["community_user_company_one"].id,
        empresa_context_id=sample_empresa.id,
        blocked_at=datetime.now(timezone.utc),
        blocked_by_user_id=community_users["user_company_one"].id,
    )
    db.add(thread)
    db.commit()
    db.refresh(thread)

    with pytest.raises(HTTPException, match="Solo el usuario que bloqueó la conversación puede reactivarla"):
        community._ensure_can_unblock_dm_thread(thread, community_users["community_user_company_one"])

    community._ensure_can_unblock_dm_thread(thread, community_users["user_company_one"])


def test_company_admin_can_only_review_internal_appeals_of_active_company(db, sample_empresa, sample_empresa_two, community_users):
    internal_sanction = CommunitySanction(
        target_user_id=community_users["user_company_one"].id,
        issued_by_user_id=community_users["admin_company_one"].id,
        sanction_type="bloqueo_interno",
        scope="interno_empresa",
        target_empresa_id=sample_empresa.id,
        reason="Sanción interna",
        is_active=True,
    )
    public_sanction = CommunitySanction(
        target_user_id=community_users["user_company_one"].id,
        issued_by_user_id=community_users["superadmin"].id,
        sanction_type="bloqueo_publico",
        scope="publico",
        target_empresa_id=None,
        reason="Sanción pública",
        is_active=True,
    )
    db.add_all([internal_sanction, public_sanction])
    db.flush()

    internal_appeal = CommunitySanctionAppeal(
        sanction_id=internal_sanction.id,
        appellant_user_id=community_users["user_company_one"].id,
        status="abierta",
        reason="Apelo la sanción interna",
    )
    public_appeal = CommunitySanctionAppeal(
        sanction_id=public_sanction.id,
        appellant_user_id=community_users["user_company_one"].id,
        status="abierta",
        reason="Apelo la sanción pública",
    )
    db.add_all([internal_appeal, public_appeal])
    db.commit()
    db.refresh(internal_appeal)
    db.refresh(public_appeal)

    community._ensure_can_review_sanction_appeal(internal_appeal, community_users["admin_company_one"], sample_empresa.id)

    with pytest.raises(HTTPException, match="solo puede resolver apelaciones internas de su empresa"):
        community._ensure_can_review_sanction_appeal(public_appeal, community_users["admin_company_one"], sample_empresa.id)

    with pytest.raises(HTTPException, match="su empresa activa"):
        community._ensure_can_review_sanction_appeal(internal_appeal, community_users["admin_company_two"], sample_empresa_two.id)


def test_author_can_only_edit_own_post_within_window(db, sample_empresa, community_users):
    fresh_post = CommunityPost(
        scope="publico",
        status="publicado",
        title="Post fresco",
        body="Texto",
        author_user_id=community_users["user_company_one"].id,
        empresa_id=sample_empresa.id,
    )
    old_post = CommunityPost(
        scope="publico",
        status="publicado",
        title="Post viejo",
        body="Texto",
        author_user_id=community_users["user_company_one"].id,
        empresa_id=sample_empresa.id,
        created_at=datetime.now(timezone.utc) - timedelta(minutes=31),
    )
    db.add_all([fresh_post, old_post])
    db.commit()
    db.refresh(fresh_post)
    db.refresh(old_post)

    assert community._can_author_edit_post(fresh_post, community_users["user_company_one"]) is True
    assert community._can_author_edit_post(old_post, community_users["user_company_one"]) is False


def test_author_cannot_delete_post_with_visible_replies(db, sample_empresa, community_users):
    post = CommunityPost(
        scope="publico",
        status="publicado",
        title="Post con respuestas",
        body="Texto",
        author_user_id=community_users["user_company_one"].id,
        empresa_id=sample_empresa.id,
    )
    db.add(post)
    db.flush()
    reply = community.CommunityPostReply(
        post_id=post.id,
        author_user_id=community_users["community_user_company_one"].id,
        body="Respuesta visible",
        status="publicado",
    )
    db.add(reply)
    db.commit()
    db.refresh(post)

    assert community._can_author_delete_post(post, community_users["user_company_one"]) is False


def test_visible_user_response_exposes_stable_community_handle(db, sample_empresa, community_users):
    user = community_users["community_user_company_one"]
    user.alias = "Comunidad.Uno"
    db.add(user)
    db.commit()
    db.refresh(user)

    response = community.CommunityVisibleUserResponse(
        id=user.id,
        nombre_completo=user.nombre_completo,
        email=user.email,
        empresa_id=user.empresa_id,
        empresa_nombre=sample_empresa.nombre,
        rol=user.rol,
        community_handle=community._community_user_handle(user),
        last_active_at=user.last_active_at,
        community_state="activo",
        active_sanctions=[],
    )

    assert response.community_handle == "comunidad.uno"


def test_restricted_topic_mentions_only_allow_visible_topic_members(db, sample_empresa, community_users):
    topic = CommunityTopic(
        scope="interno_empresa",
        nombre="Tema cerrado",
        descripcion="Privado",
        is_restricted=True,
        is_active=True,
        target_empresa_id=sample_empresa.id,
        created_by_user_id=community_users["admin_company_one"].id,
    )
    community_users["community_user_company_one"].alias = "miembro"
    community_users["user_company_one"].alias = "externo"
    db.add(topic)
    db.flush()
    db.add(
        CommunityTopicMember(
            topic_id=topic.id,
            user_id=community_users["community_user_company_one"].id,
            added_by_user_id=community_users["admin_company_one"].id,
        )
    )
    db.commit()
    db.refresh(topic)

    resolved_mentions = community._resolve_contextual_mentions(
        db,
        company_id=sample_empresa.id,
        scope="interno_empresa",
        topic=topic,
        body="Hola @miembro",
    )
    assert len(resolved_mentions) == 1
    assert resolved_mentions[0].user_id == community_users["community_user_company_one"].id

    with pytest.raises(HTTPException, match="no son válidas en este contexto"):
        community._resolve_contextual_mentions(
            db,
            company_id=sample_empresa.id,
            scope="interno_empresa",
            topic=topic,
            body="Hola @externo",
        )


def test_feed_sort_prioritizes_pinned_and_recent_activity(db, sample_empresa, community_users):
    old_pinned = CommunityPost(
        scope="publico",
        status="publicado",
        title="Fijado antiguo",
        body="Base",
        author_user_id=community_users["user_company_one"].id,
        empresa_id=sample_empresa.id,
        is_pinned=True,
        created_at=datetime.now(timezone.utc) - timedelta(days=3),
    )
    active_normal = CommunityPost(
        scope="publico",
        status="publicado",
        title="Normal activo",
        body="Base",
        author_user_id=community_users["community_user_company_one"].id,
        empresa_id=sample_empresa.id,
        created_at=datetime.now(timezone.utc) - timedelta(days=2),
    )
    fresh_normal = CommunityPost(
        scope="publico",
        status="publicado",
        title="Normal nuevo",
        body="Base",
        author_user_id=community_users["community_user_company_one"].id,
        empresa_id=sample_empresa.id,
        created_at=datetime.now(timezone.utc) - timedelta(hours=2),
    )
    db.add_all([old_pinned, active_normal, fresh_normal])
    db.flush()
    db.add(
        CommunityPostReply(
            post_id=active_normal.id,
            author_user_id=community_users["user_company_one"].id,
            body="Respuesta reciente",
            status="publicado",
            created_at=datetime.now(timezone.utc) - timedelta(minutes=10),
        )
    )
    db.commit()
    for post in [old_pinned, active_normal, fresh_normal]:
        db.refresh(post)

    ordered_recent = community._sort_posts([fresh_normal, active_normal, old_pinned], "recent_activity")
    ordered_created = community._sort_posts([fresh_normal, active_normal, old_pinned], "created_at")

    assert [post.title for post in ordered_recent] == ["Fijado antiguo", "Normal activo", "Normal nuevo"]
    assert [post.title for post in ordered_created] == ["Fijado antiguo", "Normal nuevo", "Normal activo"]


def test_public_attachments_only_accept_images():
    with pytest.raises(HTTPException, match="solo se permiten imágenes"):
        community._validate_attachment_policy("publico", "application/pdf")

    community._validate_attachment_policy("publico", "image/png")


def test_internal_attachments_receive_30_day_retention():
    expires_at = community._attachment_expiration_for_scope("interno_empresa")
    assert expires_at is not None
    assert expires_at > datetime.now(timezone.utc) + timedelta(days=29)


def test_purge_expired_community_attachments_marks_deleted(db, sample_empresa, community_users, tmp_path):
    storage_file = tmp_path / "temp.pdf"
    storage_file.write_bytes(b"demo")
    attachment = CommunityAttachment(
        created_by_user_id=community_users["user_company_one"].id,
        target_empresa_id=sample_empresa.id,
        scope="interno_empresa",
        file_name="temp.pdf",
        storage_path=str(storage_file),
        public_url="/uploads/community/temp.pdf",
        content_type="application/pdf",
        size_bytes=4,
        expires_at=datetime.now(timezone.utc) - timedelta(days=1),
    )
    db.add(attachment)
    db.commit()

    purged = community.purge_expired_community_attachments(db)
    db.refresh(attachment)

    assert purged == 1
    assert attachment.deleted_at is not None
    assert storage_file.exists() is False


def test_author_can_manage_attachment_on_own_post(db, sample_empresa, community_users, tmp_path):
    post = CommunityPost(
        scope="interno_empresa",
        status="publicado",
        title="Post con adjunto",
        body="Texto",
        author_user_id=community_users["user_company_one"].id,
        empresa_id=sample_empresa.id,
        target_empresa_id=sample_empresa.id,
    )
    db.add(post)
    db.flush()
    storage_file = tmp_path / "post-file.pdf"
    storage_file.write_bytes(b"demo")
    attachment = CommunityAttachment(
        post_id=post.id,
        created_by_user_id=community_users["user_company_one"].id,
        target_empresa_id=sample_empresa.id,
        scope="interno_empresa",
        file_name="post-file.pdf",
        storage_path=str(storage_file),
        public_url="/uploads/community/post-file.pdf",
        content_type="application/pdf",
        size_bytes=4,
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)

    resolved_post, resolved_reply, siblings = community._ensure_can_manage_attachment(
        attachment,
        community_users["user_company_one"],
        sample_empresa.id,
        db,
    )

    assert resolved_post.id == post.id
    assert resolved_reply is None
    assert siblings == []


def test_author_can_manage_attachment_on_own_reply(db, sample_empresa, community_users, tmp_path):
    post = CommunityPost(
        scope="interno_empresa",
        status="publicado",
        title="Post base",
        body="Texto",
        author_user_id=community_users["user_company_one"].id,
        empresa_id=sample_empresa.id,
        target_empresa_id=sample_empresa.id,
    )
    db.add(post)
    db.flush()
    reply = CommunityPostReply(
        post_id=post.id,
        author_user_id=community_users["community_user_company_one"].id,
        body="Respuesta con adjunto",
        status="publicado",
    )
    db.add(reply)
    db.flush()
    storage_file = tmp_path / "reply-file.pdf"
    storage_file.write_bytes(b"demo")
    attachment = CommunityAttachment(
        reply_id=reply.id,
        created_by_user_id=community_users["community_user_company_one"].id,
        target_empresa_id=sample_empresa.id,
        scope="interno_empresa",
        file_name="reply-file.pdf",
        storage_path=str(storage_file),
        public_url="/uploads/community/reply-file.pdf",
        content_type="application/pdf",
        size_bytes=4,
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)

    resolved_post, resolved_reply, siblings = community._ensure_can_manage_attachment(
        attachment,
        community_users["community_user_company_one"],
        sample_empresa.id,
        db,
    )

    assert resolved_post.id == post.id
    assert resolved_reply.id == reply.id
    assert len(siblings) == 1


def test_company_admin_can_moderate_internal_attachment_of_active_company(db, sample_empresa, community_users, tmp_path):
    post = CommunityPost(
        scope="interno_empresa",
        status="publicado",
        title="Interno con adjunto",
        body="Texto",
        author_user_id=community_users["user_company_one"].id,
        empresa_id=sample_empresa.id,
        target_empresa_id=sample_empresa.id,
    )
    db.add(post)
    db.flush()
    storage_file = tmp_path / "mod-internal.pdf"
    storage_file.write_bytes(b"demo")
    attachment = CommunityAttachment(
        post_id=post.id,
        created_by_user_id=community_users["user_company_one"].id,
        target_empresa_id=sample_empresa.id,
        scope="interno_empresa",
        file_name="mod-internal.pdf",
        storage_path=str(storage_file),
        public_url="/uploads/community/mod-internal.pdf",
        content_type="application/pdf",
        size_bytes=4,
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)

    resolved_post, resolved_reply, siblings = community._ensure_can_moderate_attachment(
        attachment,
        community_users["admin_company_one"],
        sample_empresa.id,
        db,
    )

    assert resolved_post.id == post.id
    assert resolved_reply is None
    assert siblings == []


def test_company_admin_cannot_moderate_public_attachment(db, sample_empresa, community_users, tmp_path):
    post = CommunityPost(
        scope="publico",
        status="publicado",
        title="Publico con imagen",
        body="Texto",
        author_user_id=community_users["user_company_one"].id,
        empresa_id=sample_empresa.id,
    )
    db.add(post)
    db.flush()
    storage_file = tmp_path / "public.png"
    storage_file.write_bytes(b"demo")
    attachment = CommunityAttachment(
        post_id=post.id,
        created_by_user_id=community_users["user_company_one"].id,
        target_empresa_id=sample_empresa.id,
        scope="publico",
        file_name="public.png",
        storage_path=str(storage_file),
        public_url="/uploads/community/public.png",
        content_type="image/png",
        size_bytes=4,
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)

    with pytest.raises(HTTPException, match="No tiene permisos para moderar este adjunto"):
        community._ensure_can_moderate_attachment(
            attachment,
            community_users["admin_company_one"],
            sample_empresa.id,
            db,
        )


def test_superadmin_can_mark_all_admin_alerts_as_read(db, sample_empresa, community_users):
    alert_one = CommunityAdminAlert(
        alert_type="infraction_public_link",
        title="Alerta 1",
        message="Detalle 1",
        target_empresa_id=sample_empresa.id,
        target_user_id=community_users["user_company_one"].id,
        is_read=False,
    )
    alert_two = CommunityAdminAlert(
        alert_type="infraction_public_link",
        title="Alerta 2",
        message="Detalle 2",
        target_empresa_id=sample_empresa.id,
        target_user_id=community_users["community_user_company_one"].id,
        is_read=False,
    )
    db.add_all([alert_one, alert_two])
    db.commit()

    response = community.mark_all_community_admin_alerts_as_read(
        db=db,
        current_user=community_users["superadmin"],
        empresa_id=sample_empresa.id,
    )

    assert response.updated_count == 2
    assert db.query(CommunityAdminAlert).filter(CommunityAdminAlert.is_read.is_(False)).count() == 0


def test_non_superadmin_cannot_mark_all_admin_alerts_as_read(db, sample_empresa, community_users):
    with pytest.raises(HTTPException, match="Solo superadmin puede gestionar alertas administrativas"):
        community.mark_all_community_admin_alerts_as_read(
            db=db,
            current_user=community_users["admin_company_one"],
            empresa_id=sample_empresa.id,
        )


def test_read_community_posts_tolerates_mixed_datetime_shapes_and_null_attachment_created_at(db, sample_empresa, community_users):
    post = CommunityPost(
        scope="publico",
        status="publicado",
        title="Post legado",
        body="Texto base",
        author_user_id=community_users["user_company_one"].id,
        empresa_id=sample_empresa.id,
        created_at=datetime.now(timezone.utc) - timedelta(days=1),
    )
    db.add(post)
    db.flush()
    db.add(
        CommunityPostReply(
            post_id=post.id,
            author_user_id=community_users["community_user_company_one"].id,
            body="Respuesta heredada",
            status="publicado",
            created_at=datetime.now() - timedelta(minutes=20),
        )
    )
    attachment = CommunityAttachment(
        post_id=post.id,
        created_by_user_id=community_users["user_company_one"].id,
        target_empresa_id=sample_empresa.id,
        scope="publico",
        file_name="legacy.png",
        storage_path="uploads/community/legacy.png",
        public_url="/uploads/community/legacy.png",
        content_type="image/png",
        size_bytes=10,
        created_at=None,
    )
    db.add(attachment)
    db.commit()

    posts = community.read_community_posts(
        scope="publico",
        topic_id=None,
        order="recent_activity",
        db=db,
        current_user=community_users["user_company_one"],
        empresa_id=sample_empresa.id,
    )

    assert len(posts) == 1
    assert posts[0].id == post.id
    assert posts[0].attachments[0].file_name == "legacy.png"
    assert posts[0].last_activity_at.tzinfo is not None
    assert posts[0].attachments[0].created_at.tzinfo is not None


def test_read_community_posts_filters_internal_scope_by_active_company(db, sample_empresa, sample_empresa_two, community_users):
    same_company_post = CommunityPost(
        scope="interno_empresa",
        status="publicado",
        title="Interno visible",
        body="Empresa uno",
        author_user_id=community_users["user_company_one"].id,
        empresa_id=sample_empresa.id,
        target_empresa_id=sample_empresa.id,
    )
    foreign_company_post = CommunityPost(
        scope="interno_empresa",
        status="publicado",
        title="Interno externo",
        body="Empresa dos",
        author_user_id=community_users["user_company_two"].id,
        empresa_id=sample_empresa_two.id,
        target_empresa_id=sample_empresa_two.id,
    )
    db.add_all([same_company_post, foreign_company_post])
    db.commit()

    posts = community.read_community_posts(
        scope="interno_empresa",
        topic_id=None,
        order="recent_activity",
        db=db,
        current_user=community_users["admin_company_one"],
        empresa_id=sample_empresa.id,
    )

    assert [item.title for item in posts] == ["Interno visible"]


def test_dm_thread_and_messages_tolerate_legacy_datetimes(db, sample_empresa, community_users):
    thread = CommunityDmThread(
        user_a_id=community_users["user_company_one"].id,
        user_b_id=community_users["community_user_company_one"].id,
        empresa_context_id=sample_empresa.id,
        blocked_at=datetime.now(),
    )
    db.add(thread)
    db.flush()
    message = community.CommunityDmMessage(
        thread_id=thread.id,
        author_user_id=community_users["user_company_one"].id,
        body="Mensaje legado",
        created_at=datetime.now(),
        read_at=datetime.now(),
    )
    db.add(message)
    db.commit()
    db.refresh(thread)
    db.refresh(message)

    serialized_thread = community._serialize_dm_thread(thread, community_users["user_company_one"])
    serialized_message = community._serialize_dm_message(message, thread)

    assert serialized_thread.last_message_at is not None
    assert serialized_thread.last_message_at.tzinfo is not None
    assert serialized_thread.blocked_at is not None
    assert serialized_thread.blocked_at.tzinfo is not None
    assert serialized_message.created_at.tzinfo is not None
    assert serialized_message.read_at.tzinfo is not None


def test_sanction_and_appeal_serialization_tolerate_legacy_datetimes(db, sample_empresa, community_users):
    sanction = CommunitySanction(
        target_user_id=community_users["user_company_one"].id,
        issued_by_user_id=community_users["admin_company_one"].id,
        sanction_type="bloqueo_interno",
        scope="interno_empresa",
        target_empresa_id=sample_empresa.id,
        reason="Sanción legado",
        is_active=True,
        created_at=datetime.now(),
        expires_at=datetime.now(),
    )
    db.add(sanction)
    db.flush()
    appeal = CommunitySanctionAppeal(
        sanction_id=sanction.id,
        appellant_user_id=community_users["user_company_one"].id,
        reviewed_by_user_id=community_users["admin_company_one"].id,
        status="rechazada",
        reason="Apelación legado",
        resolution_note="Sin cambios",
        created_at=datetime.now(),
        reviewed_at=datetime.now(),
    )
    db.add(appeal)
    db.commit()
    db.refresh(sanction)
    db.refresh(appeal)

    serialized_sanction = community._serialize_sanction(sanction)
    serialized_appeal = community._serialize_sanction_appeal(appeal)

    assert serialized_sanction.created_at.tzinfo is not None
    assert serialized_sanction.expires_at.tzinfo is not None
    assert serialized_appeal.created_at.tzinfo is not None
    assert serialized_appeal.reviewed_at.tzinfo is not None
