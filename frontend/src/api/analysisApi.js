import apiClient from '../lib/apiClient';

export const getDomains = async () => {
  const response = await apiClient.get('/domains');
  return response.data;
};

export const getIndustryRoles = async (domain) => {
  const response = await apiClient.get('/industry-roles', {
    params: domain ? { domain } : undefined,
  });
  return response.data;
};

export const getSkillGap = async (roleName, domain) => {
  const response = await apiClient.get(`/skill-gap/${encodeURIComponent(roleName)}`, {
    params: domain ? { domain } : undefined,
  });
  return response.data;
};

export const getSkillGapForTargetRole = async () => {
  const response = await apiClient.get('/skill-gap');
  return response.data;
};
