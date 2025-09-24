"""
Модели базы данных для Recruit.ai
"""

from .user import User, CandidateProfile, CompanyProfile, UserRole, RecruitmentStream
from .job import Job, InterviewInvitation, JobStatus, JobType, ExperienceLevel, InvitationStatus, JobApplication, JobApplicationStatus
from .interview import InterviewSession, AIAnalysis, InterviewQuestion
from .interview_report import InterviewReport, ReportStatus
from .integration import (
    PlatformIntegration, ExternalCandidate, IntegrationLog, CandidateImport,
    IntegrationPlatform, IntegrationStatus
)

__all__ = [
    "User",
    "CandidateProfile", 
    "CompanyProfile",
    "UserRole",
    "RecruitmentStream",
    "Job",
    "InterviewInvitation",
    "JobStatus",
    "JobType", 
    "ExperienceLevel",
    "InvitationStatus",
    "JobApplication",
    "JobApplicationStatus",
    "InterviewSession",
    "AIAnalysis",
    "InterviewQuestion",
    "InterviewReport",
    "ReportStatus",
    "PlatformIntegration",
    "ExternalCandidate",
    "IntegrationLog",
    "CandidateImport",
    "IntegrationPlatform",
    "IntegrationStatus"
]







