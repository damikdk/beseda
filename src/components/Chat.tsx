import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Clipboard from "expo-clipboard";
import * as Crypto from "expo-crypto";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Share,
  StyleSheet,
  View,
} from "react-native";
import ContextMenu from "react-native-context-menu-view";
import {
  Composer,
  GiftedChat,
  IMessage,
  InputToolbar,
  MessageProps,
  Send,
} from "react-native-gifted-chat";
import Markdown from "react-native-marked";
import Animated, {
  FadeInDown,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { postRequest } from "../api";
import { useStore } from "../store/AppStore";
import {
  convertIMessageToMessage,
  Message,
  messageToIMessage,
  Thread,
  useContentStore,
} from "../store/ContentStore";

const MessengerBarContainer = (props) => {
  return (
    <InputToolbar
      {...props}
      containerStyle={{
        backgroundColor: "#222",
        alignContent: "center",
        justifyContent: "center",
        borderWidth: 0,
        marginBottom: 5,
        borderRadius: 20,
        borderTopColor: "transparent",
        overflow: "hidden",
      }}
    />
  );
};

type Props = {
  thread: Thread;
};

const renderMessage = (
  props: MessageProps<IMessage>,
  onRemove: (message: Message) => void
) => {
  const { currentMessage, user } = props;
  const isUser = currentMessage.user._id == user._id;

  return (
    <ContextMenu
      actions={[
        { title: "Copy", systemIcon: "doc.on.clipboard" },
        { title: "Share raw", systemIcon: "square.and.arrow.up" },
        // { title: "Copy as plain text", systemIcon: "doc.on.clipboard" },
        { title: "Remove", systemIcon: "minus.circle.fill", destructive: true },
      ]}
      onPress={(e) => {
        if (e.nativeEvent.index == 0) {
          Clipboard.setStringAsync(currentMessage.text);
        } else if (e.nativeEvent.index == 1) {
          Share.share({ message: currentMessage.text });
        } else if (e.nativeEvent.index == 2) {
          onRemove(convertIMessageToMessage(currentMessage));
        }
      }}
      previewBackgroundColor="transparent"
    >
      <Animated.View
        layout={LinearTransition}
        entering={FadeInDown}
        exiting={FadeOut}
        key={currentMessage._id}
        style={[
          messageStyles.container,
          isUser && {
            alignSelf: "flex-end",
            maxWidth: "90%",
            backgroundColor: "#222",
          },
        ]}
      >
        <View style={[isUser && { alignSelf: "flex-end" }]}>
          <Markdown
            value={currentMessage.text || "Error"}
            flatListProps={{ style: { backgroundColor: "transparent" } }}
          />
        </View>
      </Animated.View>
    </ContextMenu>
  );
};

const Chat = ({ thread }: Props) => {
  const { token } = useStore();
  const { addMessage, removeMessage, renameThread } = useContentStore();

  const [messages, setMessages] = useState(
    thread?.messages.map(messageToIMessage).reverse() || []
  );

  const insets = useSafeAreaInsets();

  const fireRequest = async (request: string): Promise<string> => {
    try {
      const response = await postRequest(request, token, thread.messages);

      if (response.is_success) {
        console.log(
          "used_words_count, used_tokens_count:",
          response.used_words_count,
          response.used_tokens_count
        );

        return response.response;
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Error CHAD", JSON.stringify(response));
      }
    } catch (error) {
      console.error(error);
    }
  };

  // If thread changed from above
  useEffect(() => {
    setMessages(thread?.messages.map(messageToIMessage).reverse() || []);
  }, [thread]);

  const nameThread = async (firstMessage: string) => {
    if (messages.length == 0) {
      // Rename thread depends on user first request
      const answer = await fireRequest(
        "User sent this to thread:\n" +
          firstMessage +
          "\ncreate short name for this thread. Answer with just it"
      );

      if (answer?.length > 0) {
        renameThread(thread.id, answer);
      }
    }
  };

  const onSend = async (newMessages: IMessage[] = []) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);

    const lastMessage = newMessages[newMessages.length - 1];
    addMessage(convertIMessageToMessage(lastMessage), thread.id);

    const answer = await fireRequest(lastMessage.text);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);

    if (!answer || answer.length < 1) {
      return;
    }

    const gptMessage: Partial<Message> = {
      text: answer,
      user: "ChadGPT, 4o mini",
    };

    addMessage(gptMessage, thread.id);

    await nameThread(lastMessage.text);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "black" }}>
      <GiftedChat
        key={thread?.id}
        messages={messages}
        keyboardShouldPersistTaps="always"
        onSend={(newMessages) => onSend(newMessages)}
        renderAvatar={() => null}
        renderMessage={(props) =>
          renderMessage(props, (message) =>
            removeMessage(message.id, thread.id)
          )
        }
        renderSend={(props) => (
          <Send
            {...props}
            containerStyle={[
              props.containerStyle,
              {
                width: 35,
                height: 35,
                marginRight: 5,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "white",
              },
            ]}
          >
            <MaterialIcons name="arrow-upward" size={30} color="black" />
          </Send>
        )}
        user={{ _id: "user" }}
        listViewProps={{
          // Its reversed list, so paddingBottom is actually top
          contentContainerStyle: { paddingBottom: insets.top + 80, gap: 10 },
          keyboardDismissMode: "interactive",
          showsVerticalScrollIndicator: false,
          // automaticallyAdjustKeyboardInsets: true
        }}
        renderComposer={(props) => (
          <Composer
            textInputStyle={{ color: "white", backgroundColor: "#222" }}
            {...props}
          />
        )}
        renderInputToolbar={(props) => MessengerBarContainer(props)}
        scrollToBottom
        messageIdGenerator={Crypto.randomUUID}
        // textInputProps={{ autoFocus: true }}
        // scrollToBottomStyle={{ backgroundColor: "#FFF" }}
        // onPress={(context, message) => console.log("onPress", context, message)}
        // onLongPress={(context, message) =>
        //   console.log("onLongPress", context, message)
        // }
      />
    </KeyboardAvoidingView>
  );
};

const messageStyles = StyleSheet.create({
  container: {
    // backgroundColor: "#111",
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  text: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 25,
    maxWidth: 700,
  },
  userText: {
    color: "white",
    fontSize: 15,
    fontWeight: "500",
    textAlign: "right",
  },
});

export default Chat;
