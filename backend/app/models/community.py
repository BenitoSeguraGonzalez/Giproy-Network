from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class CommunityCategory(Base):
    __tablename__ = "community_categories"

    id = Column(Integer, primary_key=True)
    scope = Column(String(30), nullable=False, index=True, default="publico")
    nombre = Column(String(160), nullable=False, index=True)
    descripcion = Column(Text, nullable=True)
    orden = Column(Integer, nullable=False, default=0, server_default="0", index=True)
    is_active = Column(Boolean, nullable=False, default=True, server_default="true", index=True)
    target_empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=True, index=True)
    created_by_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())

    target_empresa = relationship("Empresa", foreign_keys=[target_empresa_id])
    created_by = relationship("Usuario", foreign_keys=[created_by_user_id])
    topics = relationship("CommunityTopic", back_populates="category")


class CommunityTopic(Base):
    __tablename__ = "community_topics"

    id = Column(Integer, primary_key=True)
    scope = Column(String(30), nullable=False, index=True, default="publico")
    nombre = Column(String(160), nullable=False, index=True)
    descripcion = Column(Text, nullable=True)
    category_id = Column(Integer, ForeignKey("community_categories.id", ondelete="SET NULL"), nullable=True, index=True)
    is_restricted = Column(Boolean, nullable=False, default=False, server_default="false", index=True)
    is_active = Column(Boolean, nullable=False, default=True, server_default="true", index=True)
    target_empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=True, index=True)
    created_by_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())

    category = relationship("CommunityCategory", back_populates="topics")
    target_empresa = relationship("Empresa", foreign_keys=[target_empresa_id])
    created_by = relationship("Usuario", foreign_keys=[created_by_user_id])
    members = relationship("CommunityTopicMember", back_populates="topic", cascade="all, delete-orphan")
    followers = relationship("CommunityTopicFollow", back_populates="topic", cascade="all, delete-orphan")
    posts = relationship("CommunityPost", back_populates="topic")


class CommunityTopicMember(Base):
    __tablename__ = "community_topic_members"

    id = Column(Integer, primary_key=True)
    topic_id = Column(Integer, ForeignKey("community_topics.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    added_by_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)

    __table_args__ = (
        UniqueConstraint("topic_id", "user_id", name="uq_community_topic_members_topic_user"),
    )

    topic = relationship("CommunityTopic", back_populates="members")
    user = relationship("Usuario", foreign_keys=[user_id])
    added_by = relationship("Usuario", foreign_keys=[added_by_user_id])


class CommunityTopicFollow(Base):
    __tablename__ = "community_topic_follows"

    id = Column(Integer, primary_key=True)
    topic_id = Column(Integer, ForeignKey("community_topics.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)

    __table_args__ = (
        UniqueConstraint("topic_id", "user_id", name="uq_community_topic_follows_topic_user"),
    )

    topic = relationship("CommunityTopic", back_populates="followers")
    user = relationship("Usuario", foreign_keys=[user_id])


class CommunityPost(Base):
    __tablename__ = "community_posts"

    id = Column(Integer, primary_key=True)
    scope = Column(String(30), nullable=False, index=True, default="publico")
    status = Column(String(30), nullable=False, index=True, default="publicado")
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    allow_replies = Column(Boolean, nullable=False, default=True, server_default="true")
    is_pinned = Column(Boolean, nullable=False, default=False, server_default="false")
    topic_id = Column(Integer, ForeignKey("community_topics.id", ondelete="SET NULL"), nullable=True, index=True)
    author_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="SET NULL"), nullable=True, index=True)
    target_empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)

    topic = relationship("CommunityTopic", back_populates="posts")
    author = relationship("Usuario", foreign_keys=[author_user_id])
    empresa = relationship("Empresa", foreign_keys=[empresa_id])
    target_empresa = relationship("Empresa", foreign_keys=[target_empresa_id])
    replies = relationship("CommunityPostReply", back_populates="post", cascade="all, delete-orphan")
    attachments = relationship("CommunityAttachment", back_populates="post", cascade="all, delete-orphan")


class CommunityPostReply(Base):
    __tablename__ = "community_post_replies"

    id = Column(Integer, primary_key=True)
    post_id = Column(Integer, ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_reply_id = Column(Integer, ForeignKey("community_post_replies.id", ondelete="CASCADE"), nullable=True, index=True)
    author_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    body = Column(Text, nullable=False)
    status = Column(String(30), nullable=False, index=True, default="publicado")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)

    post = relationship("CommunityPost", back_populates="replies")
    parent_reply = relationship("CommunityPostReply", remote_side=[id])
    author = relationship("Usuario", foreign_keys=[author_user_id])
    attachments = relationship("CommunityAttachment", back_populates="reply", cascade="all, delete-orphan")


class CommunityDmThread(Base):
    __tablename__ = "community_dm_threads"

    id = Column(Integer, primary_key=True)
    user_a_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    user_b_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    empresa_context_id = Column(Integer, ForeignKey("empresas.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now(), index=True)
    blocked_at = Column(DateTime(timezone=True), nullable=True, index=True)
    blocked_by_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)

    __table_args__ = (
        UniqueConstraint("user_a_id", "user_b_id", name="uq_community_dm_threads_pair"),
    )

    user_a = relationship("Usuario", foreign_keys=[user_a_id])
    user_b = relationship("Usuario", foreign_keys=[user_b_id])
    blocked_by = relationship("Usuario", foreign_keys=[blocked_by_user_id])
    empresa_context = relationship("Empresa", foreign_keys=[empresa_context_id])
    messages = relationship("CommunityDmMessage", back_populates="thread", cascade="all, delete-orphan")


class CommunityDmMessage(Base):
    __tablename__ = "community_dm_messages"

    id = Column(Integer, primary_key=True)
    thread_id = Column(Integer, ForeignKey("community_dm_threads.id", ondelete="CASCADE"), nullable=False, index=True)
    author_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    read_at = Column(DateTime(timezone=True), nullable=True, index=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)

    thread = relationship("CommunityDmThread", back_populates="messages")
    author = relationship("Usuario", foreign_keys=[author_user_id])


class CommunityAttachment(Base):
    __tablename__ = "community_attachments"

    id = Column(Integer, primary_key=True)
    post_id = Column(Integer, ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=True, index=True)
    reply_id = Column(Integer, ForeignKey("community_post_replies.id", ondelete="CASCADE"), nullable=True, index=True)
    created_by_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    target_empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    scope = Column(String(30), nullable=False, index=True, default="interno_empresa")
    file_name = Column(String(255), nullable=False)
    storage_path = Column(String(500), nullable=False)
    public_url = Column(String(500), nullable=False)
    content_type = Column(String(120), nullable=False)
    size_bytes = Column(Integer, nullable=False, default=0, server_default="0")
    expires_at = Column(DateTime(timezone=True), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)

    post = relationship("CommunityPost", back_populates="attachments")
    reply = relationship("CommunityPostReply", back_populates="attachments")
    created_by = relationship("Usuario", foreign_keys=[created_by_user_id])
    target_empresa = relationship("Empresa", foreign_keys=[target_empresa_id])


class CommunitySanction(Base):
    __tablename__ = "community_sanctions"

    id = Column(Integer, primary_key=True)
    target_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    issued_by_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    sanction_type = Column(String(40), nullable=False, index=True)
    scope = Column(String(40), nullable=False, index=True)
    target_empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=True, index=True)
    reason = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True, server_default="true", index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    expires_at = Column(DateTime(timezone=True), nullable=True, index=True)

    target_user = relationship("Usuario", foreign_keys=[target_user_id])
    issued_by = relationship("Usuario", foreign_keys=[issued_by_user_id])
    target_empresa = relationship("Empresa", foreign_keys=[target_empresa_id])
    appeals = relationship("CommunitySanctionAppeal", back_populates="sanction", cascade="all, delete-orphan")


class CommunitySanctionAppeal(Base):
    __tablename__ = "community_sanction_appeals"

    id = Column(Integer, primary_key=True)
    sanction_id = Column(Integer, ForeignKey("community_sanctions.id", ondelete="CASCADE"), nullable=False, index=True)
    appellant_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewed_by_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    status = Column(String(30), nullable=False, default="abierta", server_default="abierta", index=True)
    reason = Column(Text, nullable=False)
    resolution_note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True, index=True)

    sanction = relationship("CommunitySanction", back_populates="appeals")
    appellant_user = relationship("Usuario", foreign_keys=[appellant_user_id])
    reviewed_by_user = relationship("Usuario", foreign_keys=[reviewed_by_user_id])


class CommunityInfraction(Base):
    __tablename__ = "community_infractions"

    id = Column(Integer, primary_key=True)
    target_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    scope = Column(String(40), nullable=False, index=True)
    infraction_type = Column(String(40), nullable=False, index=True)
    content_type = Column(String(30), nullable=False, index=True)
    content_excerpt = Column(Text, nullable=True)
    detected_link = Column(String(500), nullable=True)
    target_empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=True, index=True)
    triggered_sanction_id = Column(Integer, ForeignKey("community_sanctions.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)

    target_user = relationship("Usuario", foreign_keys=[target_user_id])
    target_empresa = relationship("Empresa", foreign_keys=[target_empresa_id])
    triggered_sanction = relationship("CommunitySanction", foreign_keys=[triggered_sanction_id])


class CommunityAdminAlert(Base):
    __tablename__ = "community_admin_alerts"

    id = Column(Integer, primary_key=True)
    alert_type = Column(String(40), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    target_empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=True, index=True)
    target_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    infraction_id = Column(Integer, ForeignKey("community_infractions.id", ondelete="SET NULL"), nullable=True, index=True)
    is_read = Column(Boolean, nullable=False, default=False, server_default="false", index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    read_at = Column(DateTime(timezone=True), nullable=True, index=True)

    target_empresa = relationship("Empresa", foreign_keys=[target_empresa_id])
    target_user = relationship("Usuario", foreign_keys=[target_user_id])
    infraction = relationship("CommunityInfraction", foreign_keys=[infraction_id])
