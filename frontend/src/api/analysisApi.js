import apiClient from '../lib/apiClient';

export const getIndustryRoles = async () => {
  const response = await apiClient.get('/industry-roles');
  return response.data;
};

export const getSkillGap = async (roleName) => {
  const response = await apiClient.get(`/skill-gap/${encodeURIComponent(roleName)}`);
  return response.data;
};
