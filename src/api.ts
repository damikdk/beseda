import { Message } from "./store/ContentStore";

// Helper function to create a POST request object
const createPostRequest = (bodyContent: object) => ({
  method: "POST",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  body: JSON.stringify(bodyContent),
});

// Helper function to handle API response
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    throw new Error(`API error: ${response.status} - ${response.statusText}`);
  }
  return response.json();
};

export const postRequest = async (
  request: string,
  token: string,
  history?: Message[] // Optional history parameter
) => {
  const historyPrepared = history
    ? history.map((message) => ({
        role: message.user === "user" ? "user" : "assistant",
        content: message.text,
      }))
    : [];

  const requestBody = {
    message: request,
    api_key: token,
    history: historyPrepared,
  };

  try {
    const response = await fetch(
      "https://ask.chadgpt.ru/api/public/gpt-4o-mini",
      createPostRequest(requestBody)
    );
    return await handleResponse(response);
  } catch (error) {
    console.error(`postRequest failed: ${error}`);
    throw error;
  }
};
