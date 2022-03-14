// import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import {
  AppRegistry,
  StyleSheet,
  Alert,
  View,
  BackHandler,
  StatusBar,
} from "react-native";
import "react-native-gesture-handler";
import NetInfo from "@react-native-community/netinfo";
import { useFonts } from "expo-font";

import Lists from "./src/navigation/List";

export default function App() {
  const [loaded] = useFonts({
    Lexend: require("./assets/fonts/Lexend-Regular.ttf"),
    LexendBold: require("./assets/fonts/Lexend-Bold.ttf"),
    Pyidaungsu: require("./assets/fonts/Pyidaungsu.ttf"),
    PyidaungsuBold: require("./assets/fonts/PyidaungsuBold.ttf"),
    Roboto: require("./assets/fonts/Roboto-Regular.ttf"),
  });

  if (!loaded) {
    return <></>;
  } else {
    return (
      <View style={styles.container}>
        <Lists />
        <StatusBar style="light" backgroundColor="#262c76" />
      </View>
    );
  }
}

AppRegistry.registerComponent("online-shopping", () => App);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});

