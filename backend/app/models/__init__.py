"""
Модели базы данных для Recruit.ai
"""

from .user import User, CandidateProfile, CompanyProfile, UserRole
from .job import Job, InterviewInvitation, JobStatus, JobType, ExperienceLevel, InvitationStatus, JobApplication, JobApplicationStatus
from .interview import InterviewSession, AIAnalysis, InterviewQuestion
from .interview_report import InterviewReport, ReportStatus

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
    "JobApplication",
    "JobApplicationStatus",
    "InterviewSession",
    "AIAnalysis",
    "InterviewQuestion",
    "InterviewReport",
    "ReportStatus"
]







