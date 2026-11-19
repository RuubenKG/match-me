export const getApiBaseUrl = () => {
    const hostname = window.location.hostname;
    return `http://${hostname}:9090`;
};

export const API_BASE_URL = getApiBaseUrl();
