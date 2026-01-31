import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const useHelloWorldMessage = () => {
  const [message, setMessage] = useState(
    API_BASE_URL ? "Loading" : "API base URL not defined"
  );

  useEffect(() => {
    if (!API_BASE_URL) return;

    fetch(`${API_BASE_URL}/`)
      .then((response) => response.json())
      .then((data) => {
        setMessage(data.message);
      })
      .catch(() => {
        setMessage("Error fetching message");
      });
  }, []);

  return message;
};

export default useHelloWorldMessage;
