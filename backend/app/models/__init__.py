"""
Модели базы данных для Recruit.ai
"""

from .user import User, CandidateProfile, CompanyProfile, UserRole
from .job import Job, InterviewInvitation, JobStatus, JobType, ExperienceLevel, InvitationStatus
from .interview import InterviewSession, AIAnalysis, InterviewQuestion

__all__ = [
    "User",
    "CandidateProfile", 
    "CompanyProfile",
    "UserRole",
    "Job",
    "InterviewInvitation",
    "JobStatus",
    "JobType", 
    "ExperienceLevel",
    "InvitationStatus",
    "InterviewSession",
    "AIAnalysis",
    "InterviewQuestion"
]
