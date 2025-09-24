"""
LinkedIn API интеграция
"""

import aiohttp
import json
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class LinkedInAPI:
    """Класс для работы с LinkedIn API"""
    
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.base_url = "https://api.linkedin.com/v2"
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0"
        }
    
    async def search_people(
        self,
        keywords: Optional[List[str]] = None,
        locations: Optional[List[str]] = None,
        experience_min: Optional[int] = None,
        experience_max: Optional[int] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Поиск людей в LinkedIn
        
        Args:
            keywords: Ключевые слова для поиска (навыки, должности)
            locations: Локации для поиска
            experience_min: Минимальный опыт работы
            experience_max: Максимальный опыт работы
            limit: Количество результатов
            
        Returns:
            Список найденных профилей
        """
        try:
            # Формируем поисковый запрос
            search_params = {
                "count": min(limit, 100),  # LinkedIn ограничивает до 100 за запрос
                "start": 0
            }
            
            # Добавляем фильтры
            if keywords:
                search_params["keywords"] = " ".join(keywords)
            
            if locations:
                search_params["location"] = ",".join(locations)
            
            # Выполняем поиск через People Search API
            url = f"{self.base_url}/peopleSearch"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=self.headers, params=search_params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return await self._process_search_results(data.get("elements", []))
                    else:
                        error_text = await response.text()
                        logger.error(f"LinkedIn API error: {response.status} - {error_text}")
                        return []
                        
        except Exception as e:
            logger.error(f"Error searching LinkedIn: {e}")
            return []
    
    async def _process_search_results(self, elements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Обработка результатов поиска LinkedIn
        """
        candidates = []
        
        for element in elements:
            try:
                # Извлекаем основную информацию
                person = element.get("person", {})
                if not person:
                    continue
                
                # Получаем ID профиля
                profile_id = person.get("id")
                if not profile_id:
                    continue
                
                # Получаем детальную информацию о профиле
                profile_data = await self._get_profile_details(profile_id)
                if profile_data:
                    candidates.append(profile_data)
                    
            except Exception as e:
                logger.error(f"Error processing LinkedIn result: {e}")
                continue
        
        return candidates
    
    async def _get_profile_details(self, profile_id: str) -> Optional[Dict[str, Any]]:
        """
        Получение детальной информации о профиле
        """
        try:
            # Получаем основную информацию профиля
            profile_url = f"{self.base_url}/people/(id:{profile_id})"
            profile_params = {
                "projection": "(id,firstName,lastName,headline,location,industry)"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(profile_url, headers=self.headers, params=profile_params) as response:
                    if response.status != 200:
                        return None
                    
                    profile_data = await response.json()
                    
                    # Получаем опыт работы
                    experience = await self._get_experience(profile_id)
                    
                    # Получаем навыки
                    skills = await self._get_skills(profile_id)
                    
                    # Получаем контактную информацию
                    contact_info = await self._get_contact_info(profile_id)
                    
                    # Формируем кандидата
                    candidate = {
                        "external_id": f"linkedin_{profile_id}",
                        "first_name": profile_data.get("firstName", {}).get("localized", {}).get("en_US"),
                        "last_name": profile_data.get("lastName", {}).get("localized", {}).get("en_US"),
                        "current_position": profile_data.get("headline", {}).get("localized", {}).get("en_US"),
                        "location": profile_data.get("location", {}).get("name"),
                        "profile_url": f"https://www.linkedin.com/in/{profile_id}",
                        "linkedin_url": f"https://www.linkedin.com/in/{profile_id}",
                        "skills": skills,
                        "summary": profile_data.get("headline", {}).get("localized", {}).get("en_US"),
                        "experience_years": self._calculate_experience_years(experience),
                        "current_company": self._get_current_company(experience),
                        "email": contact_info.get("email"),
                        "phone": contact_info.get("phone"),
                        "salary_min": None,  # LinkedIn не предоставляет информацию о зарплате
                        "salary_max": None
                    }
                    
                    return candidate
                    
        except Exception as e:
            logger.error(f"Error getting profile details for {profile_id}: {e}")
            return None
    
    async def _get_experience(self, profile_id: str) -> List[Dict[str, Any]]:
        """Получение опыта работы"""
        try:
            experience_url = f"{self.base_url}/people/(id:{profile_id})/positions"
            experience_params = {
                "count": 10,
                "projection": "(elements*(id,title,company,startDate,endDate,description))"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(experience_url, headers=self.headers, params=experience_params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("elements", [])
                    return []
        except Exception as e:
            logger.error(f"Error getting experience for {profile_id}: {e}")
            return []
    
    async def _get_skills(self, profile_id: str) -> List[str]:
        """Получение навыков"""
        try:
            skills_url = f"{self.base_url}/people/(id:{profile_id})/skills"
            skills_params = {
                "count": 50,
                "projection": "(elements*(id,name))"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(skills_url, headers=self.headers, params=skills_params) as response:
                    if response.status == 200:
                        data = await response.json()
                        skills = []
                        for skill in data.get("elements", []):
                            skill_name = skill.get("name", {}).get("localized", {}).get("en_US")
                            if skill_name:
                                skills.append(skill_name)
                        return skills
                    return []
        except Exception as e:
            logger.error(f"Error getting skills for {profile_id}: {e}")
            return []
    
    async def _get_contact_info(self, profile_id: str) -> Dict[str, Any]:
        """Получение контактной информации"""
        try:
            # LinkedIn не предоставляет прямого доступа к email и телефону
            # через API для поиска кандидатов
            # Это доступно только для собственных подключений
            return {}
        except Exception as e:
            logger.error(f"Error getting contact info for {profile_id}: {e}")
            return {}
    
    def _calculate_experience_years(self, experience: List[Dict[str, Any]]) -> Optional[int]:
        """Расчет общего опыта работы в годах"""
        if not experience:
            return None
        
        try:
            total_months = 0
            for exp in experience:
                start_date = exp.get("startDate")
                end_date = exp.get("endDate")
                
                if start_date:
                    start_year = start_date.get("year")
                    start_month = start_date.get("month", 1)
                    
                    if end_date:
                        end_year = end_date.get("year")
                        end_month = end_date.get("month", 12)
                    else:
                        # Текущая работа
                        from datetime import datetime
                        end_year = datetime.now().year
                        end_month = datetime.now().month
                    
                    if start_year and end_year:
                        months = (end_year - start_year) * 12 + (end_month - start_month)
                        total_months += max(0, months)
            
            return max(0, total_months // 12)
        except Exception as e:
            logger.error(f"Error calculating experience: {e}")
            return None
    
    def _get_current_company(self, experience: List[Dict[str, Any]]) -> Optional[str]:
        """Получение текущей компании"""
        if not experience:
            return None
        
        try:
            # Ищем текущую работу (без endDate)
            for exp in experience:
                if not exp.get("endDate"):
                    company = exp.get("company")
                    if company:
                        return company.get("name", {}).get("localized", {}).get("en_US")
            
            # Если нет текущей работы, берем последнюю
            if experience:
                last_exp = experience[0]
                company = last_exp.get("company")
                if company:
                    return company.get("name", {}).get("localized", {}).get("en_US")
            
            return None
        except Exception as e:
            logger.error(f"Error getting current company: {e}")
            return None
