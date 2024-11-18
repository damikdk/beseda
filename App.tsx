import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Main } from "./src/screens/Main";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Main />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// Сделать картинки в тексте
// Сделать нормальный инпут

// Сделать маркдаун красивее
// Сделать текст выделяемым
// Сделать копирование не только одного блока

// Сделать выбор модели

// Сделать умные чаты (надо нормально подумать, пока ебала какая-то выходит)