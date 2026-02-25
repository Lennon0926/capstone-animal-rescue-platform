import useHelloWorldMessage from "@/services/helloWorldService";


const HelloWorldDisplay = () => {
  const message = useHelloWorldMessage();

  return <div>{message}</div>;
};

export default HelloWorldDisplay;
