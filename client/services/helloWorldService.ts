import { useEffect, useState } from "react";

const useHelloWorldMessage = () => {
  const [message, setMessage] = useState("Loading");

  useEffect(() => {
    fetch("http://localhost:8080/")
      .then((response) => response.json())
      .then((data) => {
        setMessage(data.message);
      });
  }, []);

  return message;
};

export default useHelloWorldMessage;