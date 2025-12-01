export const isServerRoute = (path: string) => {
	return path.startsWith('/api/');
};

export const isClientRoute = (path: string) => {
	return !isServerRoute(path);
};
