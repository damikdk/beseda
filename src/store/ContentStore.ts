import AsyncStorage from "@react-native-async-storage/async-storage";
import { IMessage } from "react-native-gifted-chat";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware"; // For persisting state in async storage

const MOCK_THREADS: Thread[] = [
  {
    id: "1",
    title: "First test thread",
    messages: [
      // {
      //   id: "1",
      //   text: "Hello, world!",
      //   createdAt: new Date(),
      //   user: "user",
      //   threadId: "1",
      // },
    ],
  },
];

export const convertIMessageToMessage = (imes: IMessage): Message => ({
  id: String(imes._id),
  text: imes.text,
  createdAt:
    typeof imes.createdAt === "number"
      ? new Date(imes.createdAt)
      : imes.createdAt,
  user: imes.user._id,
  threadId: "",
});

export const messageToIMessage = (message: Message): IMessage => ({
  ...message,
  _id: message.id,
  user: { _id: message.user },
});

export interface Message {
  id: string;
  text: string;
  createdAt: Date;
  user: string;
  threadId: string; // Each message belongs to a thread
}

export interface Thread {
  id: string;
  title: string;
  messages: Message[]; // Messages belonging to this thread
}

interface StoreState {
  threads: Thread[];
}

type Actions = {
  addThread: (title: string) => Thread;
  editThread: (updatedThread: Thread) => void;
  renameThread: (threadId: string, newTitle: string) => void;
  removeThread: (threadId: string) => void;

  addMessage: (message: Partial<Message>, threadId: string) => Message;
  editMessage: (newMessage: Message, threadId: string) => Message;
  removeMessage: (messageId: string, threadId: string) => void;

  resetState: () => void;
};

export const useContentStore = create<StoreState & Actions>()(
  persist(
    (set) => ({
      threads: MOCK_THREADS,

      addThread: (title: string) => {
        const newThread: Thread = {
          id: `${Date.now()}`,
          title,
          messages: [],
        };

        set((state) => ({
          threads: [...state.threads, newThread],
        }));

        return newThread;
      },

      renameThread: (threadId: string, newTitle: string) => {
        set((state) => {
          const updatedThreads = state.threads.map((thread) =>
            thread.id === threadId ? { ...thread, title: newTitle } : thread
          );
          return { threads: updatedThreads };
        });
      },

      editThread: (updatedThread: Thread) => {
        set((state) => {
          const updatedThreads = state.threads.map((thread) =>
            thread.id === updatedThread.id ? updatedThread : thread
          );
          return { threads: updatedThreads };
        });
      },

      removeThread: (threadId: string): void => {
        set((state) => ({
          threads: state.threads.filter((thread) => thread.id !== threadId),
        }));
      },

      addMessage: (newMessage: Partial<Message>, threadId: string) => {
        let richMessage: Message; // Define the richMessage variable

        set((state) => {
          const updatedThreads = state.threads.map((thread) => {
            if (thread.id === threadId) {
              // Create richMessage
              richMessage = {
                id: `${Date.now()}`,
                createdAt: new Date(),
                text: "Something goes wrong",
                user: "System",
                ...newMessage,
                threadId,
              };
              return { ...thread, messages: [...thread.messages, richMessage] };
            }
            return thread;
          });
          return { threads: updatedThreads };
        });

        return richMessage; // Return the richMessage
      },

      editMessage: (newMessage: Message, threadId: string) => {
        let updatedMessage: Message | null = null; // To store the updated message

        set((state) => {
          const updatedThreads = state.threads.map((thread) => {
            if (thread.id === threadId) {
              const updatedMessages = thread.messages.map((message) => {
                if (message.id === newMessage.id) {
                  updatedMessage = { ...newMessage }; // Replace the entire message
                  return updatedMessage;
                }
                return message;
              });
              return { ...thread, messages: updatedMessages };
            }
            return thread;
          });

          return { threads: updatedThreads };
        });

        return updatedMessage as Message; // Return the updated message
      },

      removeMessage: (messageId, threadId) =>
        set((state) => {
          const updatedThreads = state.threads.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  messages: thread.messages.filter(
                    (msg) => msg.id !== messageId
                  ),
                }
              : thread
          );

          return { threads: updatedThreads };
        }),

      resetState: () =>
        set(() => {
          return { threads: MOCK_THREADS };
        }),
    }),
    {
      name: "content-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
