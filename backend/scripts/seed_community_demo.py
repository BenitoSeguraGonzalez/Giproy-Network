import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.community import (
    CommunityAdminAlert,
    CommunityAttachment,
    CommunityCategory,
    CommunityDmMessage,
    CommunityDmThread,
    CommunityInfraction,
    CommunityPost,
    CommunityPostReply,
    CommunitySanction,
    CommunitySanctionAppeal,
    CommunityTopic,
    CommunityTopicMember,
)
from app.models.empresa import Empresa
from app.models.usuario import Usuario


UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads" / "community"


def _pick_user(db, *, empresa_id=None, rol=None, exclude_ids=None):
    query = db.query(Usuario).filter(Usuario.activo.is_(True))
    if empresa_id is not None:
        query = query.filter(Usuario.empresa_id == empresa_id)
    if rol is not None:
        query = query.filter(Usuario.rol.ilike(rol))
    if exclude_ids:
        query = query.filter(~Usuario.id.in_(exclude_ids))
    return query.order_by(Usuario.id.asc()).first()


def _pick_regular_user(db, empresa_id, exclude_ids=None):
    for role in ("usuario", "usuario_comunidad"):
        user = _pick_user(db, empresa_id=empresa_id, rol=role, exclude_ids=exclude_ids)
        if user:
            return user
    return _pick_user(db, empresa_id=empresa_id, exclude_ids=exclude_ids)


def _dt(base_now, *, days=0, hours=0, minutes=0):
    return base_now - timedelta(days=days, hours=hours, minutes=minutes)


def _write_asset(file_name, content):
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    path = UPLOAD_DIR / file_name
    path.write_text(content, encoding="utf-8")
    return str(path), f"/uploads/community/{file_name}", path.stat().st_size


def seed():
    db = SessionLocal()
    base_now = datetime.now(timezone.utc)
    try:
        empresas = db.query(Empresa).order_by(Empresa.id.asc()).all()
        if len(empresas) < 2:
            print("Faltan empresas suficientes para sembrar Comunidad.")
            return

        superadmin = _pick_user(db, rol="superadministrador")
        empresa_2_admin = _pick_user(db, empresa_id=2, rol="administrador") or _pick_user(db, empresa_id=1, rol="administrador")
        empresa_3_admin = _pick_user(db, empresa_id=3, rol="administrador") or _pick_user(db, empresa_id=2, rol="administrador")
        empresa_3_user = _pick_regular_user(db, empresa_3_admin.empresa_id if empresa_3_admin else 0)
        empresa_2_user = _pick_regular_user(
            db,
            empresa_2_admin.empresa_id if empresa_2_admin else 0,
            exclude_ids={empresa_2_admin.id} if empresa_2_admin else None,
        )
        empresa_1_user = _pick_regular_user(
            db,
            1,
            exclude_ids={superadmin.id if superadmin else 0},
        )
        if empresa_2_user is None:
            empresa_2_user = empresa_2_admin

        required = [superadmin, empresa_2_admin, empresa_3_admin, empresa_3_user, empresa_2_user, empresa_1_user]
        if any(user is None for user in required):
            print("Faltan usuarios base para sembrar Comunidad. Se requiere superadmin, admins de empresa y usuarios regulares.")
            return

        db.query(CommunityAttachment).delete(synchronize_session=False)
        db.query(CommunitySanctionAppeal).delete(synchronize_session=False)
        db.query(CommunitySanction).delete(synchronize_session=False)
        db.query(CommunityAdminAlert).delete(synchronize_session=False)
        db.query(CommunityInfraction).delete(synchronize_session=False)
        db.query(CommunityDmMessage).delete(synchronize_session=False)
        db.query(CommunityDmThread).delete(synchronize_session=False)
        db.query(CommunityPostReply).delete(synchronize_session=False)
        db.query(CommunityPost).delete(synchronize_session=False)
        db.query(CommunityTopicMember).delete(synchronize_session=False)
        db.query(CommunityTopic).delete(synchronize_session=False)
        db.query(CommunityCategory).delete(synchronize_session=False)
        db.commit()

        public_category = CommunityCategory(
            scope="publico",
            nombre="Anuncios y Buenas Prácticas",
            descripcion="Categoría pública para anuncios, consultas y aprendizaje abierto.",
            orden=10,
            created_by_user_id=superadmin.id,
            created_at=_dt(base_now, days=14),
        )
        public_planning_category = CommunityCategory(
            scope="publico",
            nombre="Preguntas de Obra y Planificación",
            descripcion="Consultas públicas sobre coordinación entre presupuesto, EDT y cronogramas.",
            orden=20,
            created_by_user_id=superadmin.id,
            created_at=_dt(base_now, days=13),
        )
        restricted_internal_category = CommunityCategory(
            scope="interno_empresa",
            nombre="Coordinación Interna",
            descripcion="Categoría privada para coordinación y validación interna.",
            orden=10,
            target_empresa_id=empresa_3_admin.empresa_id,
            created_by_user_id=empresa_3_admin.id,
            created_at=_dt(base_now, days=12),
        )
        open_internal_category = CommunityCategory(
            scope="interno_empresa",
            nombre="Seguimiento Operativo",
            descripcion="Categoría interna para seguimiento operativo y cierre de pendientes.",
            orden=20,
            target_empresa_id=empresa_2_admin.empresa_id,
            created_by_user_id=empresa_2_admin.id,
            created_at=_dt(base_now, days=11),
        )
        db.add_all([public_category, public_planning_category, restricted_internal_category, open_internal_category])
        db.flush()

        public_topic = CommunityTopic(
            scope="publico",
            category_id=public_category.id,
            nombre="General Público",
            descripcion="Tema abierto para conversación general autenticada.",
            is_restricted=False,
            created_by_user_id=superadmin.id,
            created_at=_dt(base_now, days=14),
        )
        public_adoption_topic = CommunityTopic(
            scope="publico",
            category_id=public_category.id,
            nombre="Adopción del sistema",
            descripcion="Experiencias de uso, fricción y mejoras detectadas.",
            is_restricted=False,
            created_by_user_id=superadmin.id,
            created_at=_dt(base_now, days=12, hours=6),
        )
        public_planning_topic = CommunityTopic(
            scope="publico",
            category_id=public_planning_category.id,
            nombre="Presupuesto, EDT y Cronograma",
            descripcion="Cruce operativo entre estructura, costos y planeación.",
            is_restricted=False,
            created_by_user_id=superadmin.id,
            created_at=_dt(base_now, days=12, hours=2),
        )
        restricted_internal_topic = CommunityTopic(
            scope="interno_empresa",
            category_id=restricted_internal_category.id,
            nombre="Planeación Interna",
            descripcion="Tema restringido para coordinación privada de empresa.",
            is_restricted=True,
            target_empresa_id=empresa_3_admin.empresa_id,
            created_by_user_id=empresa_3_admin.id,
            created_at=_dt(base_now, days=11),
        )
        internal_moderation_topic = CommunityTopic(
            scope="interno_empresa",
            category_id=restricted_internal_category.id,
            nombre="Alertas y Moderación",
            descripcion="Revisión interna de reglas, sanciones y señales operativas.",
            is_restricted=False,
            target_empresa_id=empresa_3_admin.empresa_id,
            created_by_user_id=empresa_3_admin.id,
            created_at=_dt(base_now, days=9, hours=4),
        )
        open_internal_topic = CommunityTopic(
            scope="interno_empresa",
            category_id=open_internal_category.id,
            nombre="Operación Interna",
            descripcion="Tema interno abierto a la empresa activa.",
            is_restricted=False,
            target_empresa_id=empresa_2_admin.empresa_id,
            created_by_user_id=empresa_2_admin.id,
            created_at=_dt(base_now, days=10),
        )
        internal_weekly_topic = CommunityTopic(
            scope="interno_empresa",
            category_id=open_internal_category.id,
            nombre="Cierre Semanal",
            descripcion="Tema interno para corte y validación de pendientes semanales.",
            is_restricted=True,
            target_empresa_id=empresa_2_admin.empresa_id,
            created_by_user_id=empresa_2_admin.id,
            created_at=_dt(base_now, days=8, hours=3),
        )
        db.add_all([
            public_topic,
            public_adoption_topic,
            public_planning_topic,
            restricted_internal_topic,
            internal_moderation_topic,
            open_internal_topic,
            internal_weekly_topic,
        ])
        db.flush()
        topic_members = [
            CommunityTopicMember(
                topic_id=restricted_internal_topic.id,
                user_id=empresa_3_admin.id,
                added_by_user_id=empresa_3_admin.id,
                created_at=_dt(base_now, days=11),
            ),
            CommunityTopicMember(
                topic_id=restricted_internal_topic.id,
                user_id=empresa_3_user.id,
                added_by_user_id=empresa_3_admin.id,
                created_at=_dt(base_now, days=11, minutes=5),
            ),
            CommunityTopicMember(
                topic_id=internal_weekly_topic.id,
                user_id=empresa_2_admin.id,
                added_by_user_id=empresa_2_admin.id,
                created_at=_dt(base_now, days=8),
            ),
        ]
        if empresa_2_user.id != empresa_2_admin.id:
            topic_members.append(
                CommunityTopicMember(
                    topic_id=internal_weekly_topic.id,
                    user_id=empresa_2_user.id,
                    added_by_user_id=empresa_2_admin.id,
                    created_at=_dt(base_now, days=8, minutes=5),
                )
            )
        db.add_all(topic_members)

        public_posts = [
            CommunityPost(
                scope="publico",
                topic_id=public_topic.id,
                status="publicado",
                title="Bienvenida a Comunidad GiProy",
                body="Este espacio público sirve para compartir ideas, novedades de producto y conversaciones abiertas entre empresas.",
                author_user_id=superadmin.id,
                empresa_id=superadmin.empresa_id,
                is_pinned=True,
                created_at=_dt(base_now, days=10),
            ),
            CommunityPost(
                scope="publico",
                topic_id=public_planning_topic.id,
                status="publicado",
                title="Consulta abierta sobre gestión de obra",
                body="¿Qué flujo les está funcionando mejor para coordinar presupuesto, cronograma y EDT sin duplicar información?",
                author_user_id=empresa_2_admin.id,
                empresa_id=empresa_2_admin.empresa_id,
                created_at=_dt(base_now, days=6, hours=2),
            ),
            CommunityPost(
                scope="publico",
                topic_id=public_topic.id,
                status="publicado",
                title="Buenas prácticas para revisión de APUs",
                body="Estamos probando una rutina semanal de revisión de recursos y rendimientos antes de pasar a presupuesto operativo. @santiago dejó un primer comentario útil.",
                author_user_id=empresa_3_user.id,
                empresa_id=empresa_3_user.empresa_id,
                created_at=_dt(base_now, days=5, hours=4),
            ),
            CommunityPost(
                scope="publico",
                topic_id=public_adoption_topic.id,
                status="publicado",
                title="Qué pantallas sienten más pesadas en uso real",
                body="Estamos auditando dónde la UI todavía roba demasiado espacio útil. Comunidad mejoró, pero queremos usar este dataset para revisar densidad, lectura y foco visual.",
                author_user_id=empresa_2_user.id,
                empresa_id=empresa_2_user.empresa_id,
                created_at=_dt(base_now, days=4, hours=1),
            ),
            CommunityPost(
                scope="publico",
                topic_id=public_adoption_topic.id,
                status="publicado",
                title="Feedback sobre navegación entre módulos",
                body="Nos interesa entender si el paso desde Comunidad hacia módulos técnicos está claro. @santiago comentó un caso real desde administración.",
                author_user_id=empresa_3_admin.id,
                empresa_id=empresa_3_admin.empresa_id,
                created_at=_dt(base_now, days=3, hours=5),
            ),
        ]
        db.add_all(public_posts)
        db.flush()

        internal_posts = [
            CommunityPost(
                scope="interno_empresa",
                topic_id=restricted_internal_topic.id,
                status="publicado",
                title=f"Coordinación interna de {empresa_3_admin.empresa.nombre}",
                body="Este hilo queda reservado para definir prioridades internas de la empresa activa y validar criterios antes de publicar fuera.",
                author_user_id=empresa_3_admin.id,
                empresa_id=empresa_3_admin.empresa_id,
                target_empresa_id=empresa_3_admin.empresa_id,
                created_at=_dt(base_now, days=5),
            ),
            CommunityPost(
                scope="interno_empresa",
                topic_id=internal_moderation_topic.id,
                status="publicado",
                title="Revisión interna de alertas y convivencia",
                body="Usaremos este hilo para validar cómo se ven sanciones, apelaciones y señales de moderación sin salir de la empresa.",
                author_user_id=empresa_3_admin.id,
                empresa_id=empresa_3_admin.empresa_id,
                target_empresa_id=empresa_3_admin.empresa_id,
                created_at=_dt(base_now, days=2, hours=12),
            ),
            CommunityPost(
                scope="interno_empresa",
                topic_id=open_internal_topic.id,
                status="publicado",
                title=f"Seguimiento privado de {empresa_2_admin.empresa.nombre}",
                body="Usaremos este post interno para revisar pendientes de presupuesto, EDT y cronograma sin exponerlos en el foro público.",
                author_user_id=empresa_2_admin.id,
                empresa_id=empresa_2_admin.empresa_id,
                target_empresa_id=empresa_2_admin.empresa_id,
                created_at=_dt(base_now, days=4, hours=10),
            ),
            CommunityPost(
                scope="interno_empresa",
                topic_id=internal_weekly_topic.id,
                status="publicado",
                title="Cierre semanal y pendientes críticos",
                body="Queda unificar el estado de compras, revisión de cuantías y validación de reportes antes del comité semanal.",
                author_user_id=empresa_2_user.id,
                empresa_id=empresa_2_user.empresa_id,
                target_empresa_id=empresa_2_admin.empresa_id,
                created_at=_dt(base_now, days=1, hours=7),
            ),
        ]
        db.add_all(internal_posts)
        db.flush()

        replies = [
            CommunityPostReply(
                post_id=public_posts[0].id,
                author_user_id=empresa_3_admin.id,
                body="Perfecto para probar visibilidad pública y moderación transversal.",
                status="publicado",
                created_at=_dt(base_now, days=9, hours=20),
            ),
            CommunityPostReply(
                post_id=public_posts[1].id,
                author_user_id=empresa_3_user.id,
                body="Nos está funcionando mejor centralizar EDT valorada y presupuesto en el mismo flujo de revisión.",
                status="publicado",
                created_at=_dt(base_now, days=6),
            ),
            CommunityPostReply(
                post_id=public_posts[3].id,
                author_user_id=empresa_2_admin.id,
                body="Presupuesto sigue siendo denso, pero Comunidad ya se siente bastante más legible que antes.",
                status="publicado",
                created_at=_dt(base_now, days=3, hours=18),
            ),
            CommunityPostReply(
                post_id=internal_posts[0].id,
                author_user_id=empresa_3_user.id,
                body="Dejo pendiente revisar la rama de compras y suministros antes del cierre semanal.",
                status="publicado",
                created_at=_dt(base_now, days=4, hours=20),
            ),
            CommunityPostReply(
                post_id=internal_posts[3].id,
                author_user_id=empresa_2_admin.id,
                body="Antes del comité necesito que revisemos también las observaciones de cronograma y la salida PDF.",
                status="publicado",
                created_at=_dt(base_now, days=1, hours=5),
            ),
            CommunityPostReply(
                post_id=internal_posts[3].id,
                author_user_id=empresa_2_user.id,
                body="Queda claro. También actualizo la nota de restricciones para que no se pierda en el resumen del cierre.",
                status="publicado",
                created_at=_dt(base_now, days=1, hours=3),
            ),
        ]
        db.add_all(replies)
        db.flush()

        public_storage, public_url, public_size = _write_asset(
            "community-public-overview.svg",
            "<svg xmlns='http://www.w3.org/2000/svg' width='720' height='320'><rect width='100%' height='100%' fill='#f7f1e8'/><text x='40' y='90' font-size='32' fill='#12324a'>Comunidad GiProy</text><text x='40' y='140' font-size='20' fill='#52606d'>Demo de feed y jerarquía visual</text></svg>",
        )
        internal_storage, internal_url, internal_size = _write_asset(
            "community-internal-checklist.txt",
            "Checklist demo de Comunidad\n- Revisar tema activo\n- Revisar métricas por tema\n- Confirmar densidad interna\n",
        )
        reply_storage, reply_url, reply_size = _write_asset(
            "community-reply-observations.txt",
            "Observaciones de respuesta\n1. El bloque activo ya se distingue mejor.\n2. Falta revisar densidad del sidebar.\n",
        )
        attachments = [
            CommunityAttachment(
                post_id=public_posts[0].id,
                created_by_user_id=superadmin.id,
                target_empresa_id=empresa_3_admin.empresa_id,
                scope="publico",
                file_name="community-public-overview.svg",
                storage_path=public_storage,
                public_url=public_url,
                content_type="image/svg+xml",
                size_bytes=public_size,
                created_at=_dt(base_now, days=9, hours=22),
            ),
            CommunityAttachment(
                post_id=internal_posts[2].id,
                created_by_user_id=empresa_2_admin.id,
                target_empresa_id=empresa_2_admin.empresa_id,
                scope="interno_empresa",
                file_name="community-internal-checklist.txt",
                storage_path=internal_storage,
                public_url=internal_url,
                content_type="text/plain",
                size_bytes=internal_size,
                expires_at=base_now + timedelta(days=21),
                created_at=_dt(base_now, days=4, hours=8),
            ),
            CommunityAttachment(
                reply_id=replies[-1].id,
                created_by_user_id=empresa_2_user.id,
                target_empresa_id=empresa_2_admin.empresa_id,
                scope="interno_empresa",
                file_name="community-reply-observations.txt",
                storage_path=reply_storage,
                public_url=reply_url,
                content_type="text/plain",
                size_bytes=reply_size,
                expires_at=base_now + timedelta(days=14),
                created_at=_dt(base_now, days=1, hours=2),
            ),
        ]
        db.add_all(attachments)
        db.flush()

        thread_specs = [
            (empresa_3_admin, empresa_3_user, empresa_3_admin.empresa_id, None, None, [
                (empresa_3_admin, "¿Puedes revisar los pendientes internos de la empresa para Comunidad?", _dt(base_now, days=5), True),
                (empresa_3_user, "Sí, hoy actualizo el hilo interno y te aviso.", _dt(base_now, days=4, hours=23), True),
                (empresa_3_admin, "Perfecto. También mira el tema restringido antes del cierre.", _dt(base_now, days=4, hours=22), True),
            ]),
            (superadmin, empresa_2_admin, empresa_2_admin.empresa_id, None, None, [
                (superadmin, "Estoy validando el comportamiento multiempresa de Comunidad desde tu contexto activo.", _dt(base_now, days=3, hours=12), True),
                (empresa_2_admin, "Perfecto, en nuestra empresa ya puedo ver público e interno sin mezclar otras compañías.", _dt(base_now, days=3, hours=11), True),
                (superadmin, "Necesito además feedback sobre la zona administrativa y los filtros.", _dt(base_now, days=3, hours=10), False),
            ]),
            (superadmin, empresa_3_admin, empresa_3_admin.empresa_id, superadmin.id, _dt(base_now, days=1, hours=15), [
                (empresa_3_admin, "Necesito confirmar si la moderación interna queda limitada a mi empresa.", _dt(base_now, days=2, hours=18), True),
                (superadmin, "Sí, como admin solo moderas el área privada de tu empresa.", _dt(base_now, days=2, hours=17), True),
            ]),
            (empresa_2_user, empresa_1_user, empresa_2_admin.empresa_id, None, None, [
                (empresa_2_user, "Te escribo para validar cómo se siente la lectura de Comunidad desde otra empresa.", _dt(base_now, days=1, hours=20), True),
                (empresa_1_user, "La parte pública va bien. Lo que aún cuesta es detectar rápido qué tema está realmente activo.", _dt(base_now, days=1, hours=19), False),
            ]),
        ]

        thread_count = 0
        message_count = 0
        for user_a, user_b, empresa_context_id, blocked_by_user_id, blocked_at, messages in thread_specs:
            low_id, high_id = sorted([user_a.id, user_b.id])
            thread = CommunityDmThread(
                user_a_id=low_id,
                user_b_id=high_id,
                empresa_context_id=empresa_context_id,
                blocked_by_user_id=blocked_by_user_id,
                blocked_at=blocked_at,
                created_at=_dt(base_now, days=6),
                updated_at=_dt(base_now, days=1),
            )
            db.add(thread)
            db.flush()
            thread_count += 1
            for author, body, created_at, is_read in messages:
                db.add(
                    CommunityDmMessage(
                        thread_id=thread.id,
                        author_user_id=author.id,
                        body=body,
                        created_at=created_at,
                        read_at=created_at + timedelta(minutes=20) if is_read else None,
                    )
                )
                message_count += 1

        sanctions = [
            CommunitySanction(
                target_user_id=empresa_1_user.id,
                issued_by_user_id=superadmin.id,
                sanction_type="bloqueo_publico",
                scope="publico",
                reason="Sanción de prueba para validar bloqueo de publicación pública.",
                is_active=True,
                created_at=_dt(base_now, days=2, hours=6),
                expires_at=base_now + timedelta(days=7),
            ),
            CommunitySanction(
                target_user_id=empresa_3_user.id,
                issued_by_user_id=empresa_3_admin.id,
                sanction_type="bloqueo_interno",
                scope="interno_empresa",
                target_empresa_id=empresa_3_admin.empresa_id,
                reason="Sanción interna de prueba para verificar moderación por empresa.",
                is_active=True,
                created_at=_dt(base_now, days=2, hours=2),
                expires_at=base_now + timedelta(days=3),
            ),
            CommunitySanction(
                target_user_id=empresa_2_user.id,
                issued_by_user_id=empresa_2_admin.id,
                sanction_type="silencio_temporal",
                scope="interno_empresa",
                target_empresa_id=empresa_2_admin.empresa_id,
                reason="Caso resuelto de demo para revisar apelación aceptada y sanción inactiva.",
                is_active=False,
                created_at=_dt(base_now, days=8),
                expires_at=_dt(base_now, days=5),
            ),
        ]
        db.add_all(sanctions)
        db.flush()

        appeals = [
            CommunitySanctionAppeal(
                sanction_id=sanctions[1].id,
                appellant_user_id=empresa_3_user.id,
                status="abierta",
                reason="Solicito revisión porque la observación quedó fuera de contexto y ya fue corregida.",
                created_at=_dt(base_now, days=1, hours=22),
            ),
            CommunitySanctionAppeal(
                sanction_id=sanctions[2].id,
                appellant_user_id=empresa_2_user.id,
                reviewed_by_user_id=empresa_2_admin.id,
                status="aceptada",
                reason="La sanción original fue útil, pero el caso ya quedó corregido internamente.",
                resolution_note="Se acepta la apelación y la sanción queda cerrada para mantener trazabilidad.",
                created_at=_dt(base_now, days=7, hours=20),
                reviewed_at=_dt(base_now, days=6, hours=12),
            ),
        ]
        db.add_all(appeals)
        db.flush()

        infractions = [
            CommunityInfraction(
                target_user_id=empresa_1_user.id,
                scope="publico",
                infraction_type="public_link_attempt",
                content_type="post",
                content_excerpt="Intento de publicar link de ejemplo en foro público para validar la política automática.",
                detected_link="https://example.invalid/demo",
                target_empresa_id=empresa_1_user.empresa_id,
                triggered_sanction_id=sanctions[0].id,
                created_at=_dt(base_now, days=2, hours=6),
            ),
            CommunityInfraction(
                target_user_id=empresa_3_user.id,
                scope="interno_empresa",
                infraction_type="hostile_language",
                content_type="reply",
                content_excerpt="Respuesta interna marcada para revisión de tono dentro del contexto de empresa.",
                target_empresa_id=empresa_3_admin.empresa_id,
                triggered_sanction_id=sanctions[1].id,
                created_at=_dt(base_now, days=1, hours=23),
            ),
        ]
        db.add_all(infractions)
        db.flush()
        db.add_all([
            CommunityAdminAlert(
                alert_type="infraction_public_link",
                title="Infracción automática de demo",
                message=(
                    f"Usuario: {empresa_1_user.nombre_completo} <{empresa_1_user.email}> | "
                    "Infracción: intento de publicar link en Público | Sanción: bloqueo_publico"
                ),
                target_empresa_id=empresa_1_user.empresa_id,
                target_user_id=empresa_1_user.id,
                infraction_id=infractions[0].id,
                is_read=False,
                created_at=_dt(base_now, days=2, hours=5, minutes=50),
            ),
            CommunityAdminAlert(
                alert_type="internal_moderation_flag",
                title="Señal interna pendiente de revisión",
                message=(
                    f"Empresa: {empresa_3_admin.empresa.nombre} | Usuario: {empresa_3_user.nombre_completo} | "
                    "Motivo: revisar si corresponde mantener sanción interna o aceptar apelación."
                ),
                target_empresa_id=empresa_3_admin.empresa_id,
                target_user_id=empresa_3_user.id,
                infraction_id=infractions[1].id,
                is_read=True,
                created_at=_dt(base_now, days=1, hours=21),
                read_at=_dt(base_now, days=1, hours=19),
            ),
            CommunityAdminAlert(
                alert_type="moderation_follow_up",
                title="Seguimiento de apelación resuelta",
                message=f"Apelación aceptada de {empresa_2_user.nombre_completo}. Se deja visible para revisar el histórico en la zona administrativa.",
                target_empresa_id=empresa_2_admin.empresa_id,
                target_user_id=empresa_2_user.id,
                is_read=False,
                created_at=_dt(base_now, days=1, hours=2),
            ),
        ])
        db.commit()

        print("Seed ampliado de Comunidad completado.")
        print(f"Empresas detectadas: {len(empresas)}")
        print(f"Posts públicos: {len(public_posts)}")
        print(f"Posts internos: {len(internal_posts)}")
        print("Categorías: 4")
        print("Temas: 7")
        print(f"Respuestas: {len(replies)}")
        print(f"Adjuntos: {len(attachments)}")
        print(f"Hilos DM: {thread_count}")
        print(f"Mensajes DM: {message_count}")
        print(f"Sanciones: {len(sanctions)}")
        print(f"Apelaciones: {len(appeals)}")
        print("Infracciones: 2")
        print("Alertas admin: 3")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
