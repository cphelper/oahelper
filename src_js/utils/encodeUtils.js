export const encodeId = (id) => {
    return btoa(id.toString());
};

export const decodeId = (encodedId) => {
    try {
        return atob(encodedId);
    } catch (error) {
        console.error('Invalid encoded ID:', error);
        return null;
    }
}; 