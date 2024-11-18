import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { BlurView } from "expo-blur";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRef, useState } from "react";
import {
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ContextMenu from "react-native-context-menu-view";
import DrawerLayout from "react-native-gesture-handler/DrawerLayout";
import Animated, {
  FadingTransition,
  useAnimatedKeyboard,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Chat from "../components/Chat";
import { useStore } from "../store/AppStore";
import { useContentStore } from "../store/ContentStore";

const AnimatedBlur = Animated.createAnimatedComponent(BlurView);

export const Main = () => {
  const { token, setToken } = useStore();
  const { threads, resetState, addThread, removeThread } = useContentStore();

  const [threadID, setThreadID] = useState("1");
  const thread = useContentStore((state) =>
    state.threads.find((t) => t.id === threadID)
  );
  const insets = useSafeAreaInsets();
  const drawer = useRef<DrawerLayout>();
  const keyboard = useAnimatedKeyboard();

  const createNewThread = () => {
    const newThread = addThread("Another one");
    setThreadID(newThread.id);
  };

  const keyboardOffset = useAnimatedStyle(() => ({
    marginBottom: keyboard.height.value,
  }));

  const Menu = () => (
    <View style={{ flex: 1, justifyContent: "flex-end" }}>
      <View style={{ justifyContent: "flex-end" }}>
        <Animated.ScrollView
          style={[keyboardOffset]}
          contentContainerStyle={{
            paddingTop: insets.top + 50,
            paddingBottom: insets.bottom,
            gap: 20,
          }}
          keyboardDismissMode="interactive"
        >
          <View style={styles.threads}>
            {/* Thread */}
            {threads?.map((someThread) => (
              <ContextMenu
                key={someThread.id}
                actions={[
                  { title: "Copy", systemIcon: "doc.on.clipboard" },
                  { title: "Share raw", systemIcon: "square.and.arrow.up" },
                  {
                    title: "Remove",
                    systemIcon: "minus.circle.fill",
                    destructive: true,
                  },
                ]}
                onPress={(e) => {
                  if (e.nativeEvent.index == 0) {
                    const finalText = thread?.messages
                      ?.reverse()
                      .reduceRight((acc, message) => {
                        return `${acc}${message.user}:\n${message.text}\n\n`;
                      }, "");

                    Clipboard.setStringAsync(finalText);
                  } else if (e.nativeEvent.index == 1) {
                    const finalText = thread?.messages
                      ?.reverse()
                      .reduceRight((acc, message) => {
                        return `${acc}${message.user}:\n${message.text}\n\n`;
                      }, "");

                    Share.share({ message: finalText });
                  } else if (e.nativeEvent.index == 2) {
                    if (thread.id == someThread.id) {
                      if (threads.length < 2) {
                        createNewThread();
                      } else {
                        setThreadID(threads[threads.length - 2].id);
                      }
                    }

                    removeThread(someThread.id);
                  }
                }}
              >
                <TouchableOpacity
                  style={[
                    {
                      height: 40,
                      justifyContent: "center",
                      paddingHorizontal: 15,
                    },
                  ]}
                  onPress={() => {
                    setThreadID(someThread.id);
                    drawer?.current?.closeDrawer();
                  }}
                  // https://github.com/mpiannucci/react-native-context-menu-view/issues/60
                  onLongPress={() => {}}
                  delayLongPress={250}
                >
                  <Text style={[styles.threadTitle, styles.darkThemeText]}>
                    {someThread.title}
                  </Text>
                </TouchableOpacity>
              </ContextMenu>
            ))}

            {/* New Thread bottom */}
            <TouchableOpacity
              style={{
                width: "auto",
                height: 40,
                backgroundColor: "#444",
                borderRadius: 20,
                marginHorizontal: 15,
                marginTop: 10,
                justifyContent: "center",
                alignItems: "center",
              }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
                createNewThread();
                drawer?.current?.closeDrawer();
              }}
            >
              <MaterialIcons
                name="library-add"
                size={25}
                color={styles.darkThemeText.color}
              />
            </TouchableOpacity>
          </View>

          {/* Token section */}
          <View>
            <View
              style={[styles.menuHeaderContainer, { paddingHorizontal: 20 }]}
            >
              <Text style={[styles.darkThemeText, styles.menuHeaderText]}>
                Token
              </Text>
            </View>

            <TextInput
              style={[
                styles.input,
                styles.darkThemeText,
                { marginHorizontal: 15 },
              ]}
              onChangeText={setToken}
              value={token}
            />
          </View>
        </Animated.ScrollView>
      </View>
    </View>
  );

  return (
    <DrawerLayout
      ref={drawer}
      drawerWidth={300}
      edgeWidth={300}
      drawerBackgroundColor={styles.darkContainer.backgroundColor}
      renderNavigationView={() => <Menu />}
      contentContainerStyle={{
        paddingBottom: insets.bottom,
      }}
    >
      <Chat thread={thread} />

      {/* Thread name */}
      <TouchableOpacity
        style={[
          styles.menuButtonContainer,
          {
            top: insets.top,
            width: "100%",
            paddingHorizontal: 60,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
        onPress={() => drawer?.current?.openDrawer()}
        onLongPress={resetState}
      >
        <AnimatedBlur
          intensity={20}
          tint="systemThinMaterialDark"
          layout={FadingTransition.duration(300)}
          style={[
            {
              width: "auto",
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 10,
              paddingVertical: 10,
              borderRadius: 25,
              overflow: "hidden",
            },
          ]}
        >
          <Text
            style={{
              color: "white",
              fontWeight: "700",
              textAlignVertical: "center",
              textAlign: "center",
            }}
            allowFontScaling
            adjustsFontSizeToFit
          >
            {thread?.title}
          </Text>
        </AnimatedBlur>
      </TouchableOpacity>

      {/* Menu button */}
      <BlurView
        intensity={8}
        style={[styles.menuButtonContainer, { marginTop: insets.top }]}
      >
        <TouchableOpacity
          style={[styles.menuButton]}
          onPress={() => drawer?.current?.openDrawer()}
          onLongPress={resetState}
        >
          <MaterialIcons
            name="menu"
            size={25}
            color={styles.darkThemeText.color}
          />
        </TouchableOpacity>
      </BlurView>

      {/* New thread button */}
      <BlurView
        intensity={10}
        style={[
          styles.menuButtonContainer,
          { marginTop: insets.top, left: undefined, right: 5 },
        ]}
      >
        <TouchableOpacity
          style={[styles.menuButton]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
            createNewThread();
          }}
        >
          <MaterialIcons
            name="library-add"
            size={25}
            color={styles.darkThemeText.color}
          />
        </TouchableOpacity>
      </BlurView>

      <LinearGradient
        colors={["#000", "transparent"]}
        style={{ position: "absolute", width: "100%", height: insets.top }}
      />
    </DrawerLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  darkContainer: {
    backgroundColor: "#333",
  },
  darkThemeText: {
    color: "#fff",
  },

  menuButtonContainer: {
    flex: 1,
    position: "absolute",
    top: 0,
    left: 5,
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
  },
  menuButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  menuHeaderContainer: {
    alignItems: "flex-start",
    justifyContent: "center",
  },

  menuHeaderText: {
    fontSize: 15,
    fontWeight: 700,
    opacity: 0.5,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 20,
    borderColor: "gray",
    padding: 10,
    marginVertical: 10,
    fontSize: 15,
  },

  threads: {},
  threadTitle: {
    fontSize: 16,
    fontWeight: 700,
  },
});
