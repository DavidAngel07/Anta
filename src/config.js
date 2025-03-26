const config = {
    API_URL:
      process.env.NODE_ENV === "production"
        ? "https://anta-backend.up.railway.app"
        : "http://localhost:3001",
  };
  
  export default config;
  