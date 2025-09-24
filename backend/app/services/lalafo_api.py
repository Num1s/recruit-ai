"""
Lalafo API интеграция
"""

import aiohttp
import json
from typing import List, Dict, Any, Optional
import logging
import re
from datetime import datetime

logger = logging.getLogger(__name__)

class LalafoAPI:
    """Класс для работы с Lalafo API"""
    
    def __init__(self, access_token: str = None):
        self.access_token = access_token
        self.base_url = "https://lalafo.kg/api"
        self.headers = {
            "Content-Type": "application/json",
            "User-Agent": "RecruitAI/1.0"
        }
        if access_token:
            self.headers["Authorization"] = f"Bearer {access_token}"
    
    async def search_job_postings(
        self,
        keywords: Optional[List[str]] = None,
        locations: Optional[List[str]] = None,
        experience_min: Optional[int] = None,
        experience_max: Optional[int] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Поиск вакансий на Lalafo
        
        Args:
            keywords: Ключевые слова для поиска (навыки, должности)
            locations: Локации для поиска
            experience_min: Минимальный опыт работы
            experience_max: Максимальный опыт работы
            limit: Количество результатов
            
        Returns:
            Список найденных вакансий с информацией о кандидатах
        """
        try:
            # Формируем поисковый запрос
            search_params = {
                "limit": min(limit, 100),
                "offset": 0,
                "category": "jobs",  # Категория "Работа"
                "sort": "date_desc"
            }
            
            # Добавляем ключевые слова
            if keywords:
                search_params["search"] = " ".join(keywords)
            
            # Выполняем поиск
            url = f"{self.base_url}/search"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=self.headers, params=search_params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return await self._process_search_results(data.get("data", []), locations)
                    else:
                        error_text = await response.text()
                        logger.error(f"Lalafo API error: {response.status} - {error_text}")
                        return []
                        
        except Exception as e:
            logger.error(f"Error searching Lalafo: {e}")
            return []
    
    async def _process_search_results(
        self, 
        data: List[Dict[str, Any]], 
        locations: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Обработка результатов поиска Lalafo
        """
        candidates = []
        
        for item in data:
            try:
                # Проверяем, что это вакансия (job posting)
                if not self._is_job_posting(item):
                    continue
                
                # Извлекаем информацию о кандидате/работодателе
                candidate_data = await self._extract_candidate_info(item)
                
                if candidate_data:
                    # Фильтруем по локации если указана
                    if locations and candidate_data.get("location"):
                        if not any(loc.lower() in candidate_data["location"].lower() for loc in locations):
                            continue
                    
                    candidates.append(candidate_data)
                    
            except Exception as e:
                logger.error(f"Error processing Lalafo result: {e}")
                continue
        
        return candidates
    
    def _is_job_posting(self, item: Dict[str, Any]) -> bool:
        """Проверяем, что это вакансия"""
        try:
            # Проверяем категорию
            category = item.get("category", {}).get("name", "").lower()
            if "работа" in category or "job" in category or "вакансия" in category:
                return True
            
            # Проверяем заголовок
            title = item.get("title", "").lower()
            job_keywords = [
                "работа", "вакансия", "job", "vacancy", "developer", "разработчик",
                "программист", "programmer", "engineer", "инженер", "designer", "дизайнер"
            ]
            
            return any(keyword in title for keyword in job_keywords)
            
        except Exception:
            return False
    
    async def _extract_candidate_info(self, item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Извлечение информации о кандидате из объявления
        """
        try:
            # Получаем основную информацию
            title = item.get("title", "")
            description = item.get("description", "")
            location = item.get("location", {}).get("name", "")
            user_info = item.get("user", {})
            
            # Извлекаем навыки из описания
            skills = self._extract_skills_from_text(description + " " + title)
            
            # Извлекаем опыт работы
            experience_years = self._extract_experience_from_text(description)
            
            # Определяем позицию
            position = self._extract_position_from_title(title)
            
            # Получаем информацию о пользователе
            user_name = user_info.get("name", "")
            user_phone = user_info.get("phone", "")
            user_id = user_info.get("id", "")
            
            # Извлекаем зарплату
            salary_min, salary_max = self._extract_salary_from_text(description)
            
            # Формируем кандидата
            candidate = {
                "external_id": f"lalafo_{item.get('id', '')}",
                "first_name": self._extract_first_name(user_name),
                "last_name": self._extract_last_name(user_name),
                "current_position": position,
                "current_company": "Не указано",
                "location": location,
                "profile_url": f"https://lalafo.kg/profile/{user_id}",
                "phone": user_phone,
                "email": None,  # Lalafo не предоставляет email в публичных объявлениях
                "skills": skills,
                "summary": description[:500] + "..." if len(description) > 500 else description,
                "experience_years": experience_years,
                "salary_min": salary_min,
                "salary_max": salary_max,
                "raw_data": {
                    "lalafo_id": item.get("id"),
                    "user_id": user_id,
                    "created_at": item.get("created_at"),
                    "category": item.get("category", {}).get("name")
                }
            }
            
            return candidate
            
        except Exception as e:
            logger.error(f"Error extracting candidate info: {e}")
            return None
    
    def _extract_skills_from_text(self, text: str) -> List[str]:
        """Извлечение навыков из текста"""
        if not text:
            return []
        
        # Список популярных навыков в IT
        common_skills = [
            "Python", "JavaScript", "Java", "C++", "C#", "PHP", "Ruby", "Go", "Rust",
            "React", "Vue.js", "Angular", "Node.js", "Django", "Flask", "Laravel",
            "MySQL", "PostgreSQL", "MongoDB", "Redis", "SQLite",
            "Docker", "Kubernetes", "AWS", "Azure", "Google Cloud",
            "Git", "Linux", "Windows", "macOS",
            "HTML", "CSS", "SASS", "LESS", "Bootstrap", "Tailwind",
            "TypeScript", "Webpack", "Gulp", "NPM", "Yarn",
            "REST API", "GraphQL", "Microservices", "CI/CD",
            "Photoshop", "Figma", "Sketch", "Adobe XD",
            "Android", "iOS", "React Native", "Flutter", "Xamarin",
            "Machine Learning", "AI", "Data Science", "Analytics"
        ]
        
        found_skills = []
        text_lower = text.lower()
        
        for skill in common_skills:
            if skill.lower() in text_lower:
                found_skills.append(skill)
        
        return found_skills
    
    def _extract_experience_from_text(self, text: str) -> Optional[int]:
        """Извлечение опыта работы из текста"""
        if not text:
            return None
        
        # Паттерны для поиска опыта
        patterns = [
            r'(\d+)\s*года?\s*опыта',
            r'(\d+)\s*years?\s*experience',
            r'опыт\s*работы\s*(\d+)\s*лет?',
            r'стаж\s*(\d+)\s*лет?',
            r'(\d+)\+?\s*лет?\s*в\s*разработке',
            r'(\d+)\+?\s*years?\s*in\s*development'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text.lower())
            if match:
                try:
                    return int(match.group(1))
                except ValueError:
                    continue
        
        return None
    
    def _extract_position_from_title(self, title: str) -> str:
        """Извлечение позиции из заголовка"""
        if not title:
            return "Разработчик"
        
        # Список популярных позиций
        positions = [
            "Senior Developer", "Middle Developer", "Junior Developer",
            "Frontend Developer", "Backend Developer", "Full Stack Developer",
            "Mobile Developer", "DevOps Engineer", "QA Engineer",
            "UI/UX Designer", "Product Manager", "Team Lead",
            "Senior Python Developer", "React Developer", "Node.js Developer",
            "Android Developer", "iOS Developer", "Data Scientist"
        ]
        
        title_lower = title.lower()
        
        for position in positions:
            if position.lower() in title_lower:
                return position
        
        # Если не найдено, возвращаем общее название
        if "developer" in title_lower or "разработчик" in title_lower:
            return "Разработчик"
        elif "designer" in title_lower or "дизайнер" in title_lower:
            return "Дизайнер"
        elif "manager" in title_lower or "менеджер" in title_lower:
            return "Менеджер"
        else:
            return title[:50] + "..." if len(title) > 50 else title
    
    def _extract_salary_from_text(self, text: str) -> tuple[Optional[int], Optional[int]]:
        """Извлечение зарплаты из текста"""
        if not text:
            return None, None
        
        # Паттерны для поиска зарплаты
        patterns = [
            r'(\d+)\s*-\s*(\d+)\s*сом',
            r'(\d+)\s*-\s*(\d+)\s*₽',
            r'(\d+)\s*-\s*(\d+)\s*руб',
            r'от\s*(\d+)\s*до\s*(\d+)\s*сом',
            r'от\s*(\d+)\s*до\s*(\d+)\s*₽',
            r'(\d+)\s*сом',
            r'(\d+)\s*₽'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text.lower())
            if match:
                try:
                    if len(match.groups()) == 2:
                        return int(match.group(1)), int(match.group(2))
                    else:
                        salary = int(match.group(1))
                        return salary, salary
                except ValueError:
                    continue
        
        return None, None
    
    def _extract_first_name(self, full_name: str) -> str:
        """Извлечение имени"""
        if not full_name:
            return "Не указано"
        
        parts = full_name.strip().split()
        return parts[0] if parts else "Не указано"
    
    def _extract_last_name(self, full_name: str) -> str:
        """Извлечение фамилии"""
        if not full_name:
            return ""
        
        parts = full_name.strip().split()
        return " ".join(parts[1:]) if len(parts) > 1 else ""
