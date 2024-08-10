"use client";
import {
  Box,
  Stack,
  TextField,
  Button,
  Typography,
  Switch,
  IconButton,
} from "@mui/material";
import { useState } from "react";
import { styled } from "@mui/system";
import SendIcon from "@mui/icons-material/Send";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { lightBlue, deepPurple } from "@mui/material/colors";
import PersonIcon from "@mui/icons-material/Person";
import ChatIcon from "@mui/icons-material/Chat";

// Custom styles for avatars and message bubbles
const MessageBubble = styled(Box)(({ theme, role }) => ({
  display: "inline-block",
  padding: "10px 15px",
  borderRadius: "16px",
  margin: "5px 0",
  color: "white",
  backgroundColor:
    role === "assistant"
      ? theme.palette.primary.main
      : theme.palette.secondary.main,
}));

const Avatar = styled(Box)(({ theme, role }) => ({
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  backgroundColor:
    role === "assistant"
      ? theme.palette.primary.main
      : theme.palette.secondary.main,
  color: "white",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  marginRight: "10px",
}));

// Light and dark theme options
const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: lightBlue,
    secondary: deepPurple,
  },
});

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: lightBlue,
    secondary: deepPurple,
  },
});

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello, I am the Headstarter AI Assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Handle sending messages to the server
  const sendMessage = async () => {
    if (message.trim() === "") return; // Prevent sending empty messages

    // Update messages locally
    const newMessages = [
      ...messages,
      { role: "user", content: message, timestamp: new Date() },
    ];
    setMessages(newMessages);
    setMessage("");
    setIsTyping(true);

    try {
      // Send the message to the server
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMessages), // Send the entire conversation
      });

      if (!response.ok) throw new Error(response.statusText);

      // Read streamed response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let assistantMessage = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          assistantMessage += decoder.decode(value, { stream: true });
        }
      }

      // Append the assistant's response to messages
      const parsedMessages = JSON.parse(assistantMessage.trim());
      const assistantContent = parsedMessages.choices[0].message.content;

      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: assistantContent,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Error fetching assistant response:", error);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "An error occurred. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle key press in the input field
  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  };

  // Toggle between light and dark mode
  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <Box
        width="100vw"
        height="100vh"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        bgcolor="background.default"
        color="text.primary"
      >
        <Stack
          direction="column"
          width="600px"
          height="700px"
          border="1px solid black"
          p={2}
          spacing={3}
          borderRadius="8px"
          overflow="hidden"
          boxShadow={3}
        >
          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <Typography>Dark Mode</Typography>
            <Switch
              checked={isDarkMode}
              onChange={handleThemeToggle}
              color="default"
            />
          </Stack>
          <Stack
            direction="column"
            spacing={2}
            flexGrow={1}
            overflow="auto"
            sx={{
              overflowY: "auto",
              paddingRight: "8px",
              "&::-webkit-scrollbar": {
                width: "6px",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "rgba(0,0,0,0.2)",
                borderRadius: "8px",
              },
            }}
          >
            {messages.map((msg, index) => (
              <Box
                key={index}
                display="flex"
                alignItems="center"
                justifyContent={
                  msg.role === "assistant" ? "flex-start" : "flex-end"
                }
              >
                {msg.role === "assistant" && (
                  <Avatar role={msg.role}>
                    <ChatIcon />
                  </Avatar>
                )}
                <Box>
                  <MessageBubble role={msg.role}>
                    {msg.content}
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{ opacity: 0.7, marginTop: "5px" }}
                    >
                      {msg.timestamp.toLocaleTimeString()}
                    </Typography>
                  </MessageBubble>
                </Box>
                {msg.role === "user" && (
                  <Avatar role={msg.role}>
                    <PersonIcon />
                  </Avatar>
                )}
              </Box>
            ))}
            {isTyping && (
              <Box display="flex" alignItems="center">
                <Avatar role="assistant">
                  <ChatIcon />
                </Avatar>
                <MessageBubble role="assistant">
                  <Typography variant="body2" sx={{ opacity: 0.6 }}>
                    Typing...
                  </Typography>
                </MessageBubble>
              </Box>
            )}
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress} // Add event listener for Enter key
            />
            <IconButton
              color="primary"
              onClick={sendMessage}
              disabled={isTyping}
            >
              <SendIcon />
            </IconButton>
          </Stack>
        </Stack>
      </Box>
    </ThemeProvider>
  );
}
