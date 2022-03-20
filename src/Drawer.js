import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Alert,
  SafeAreaView,
  Image,
  Linking,
} from "react-native";
import { ListItem, Icon } from "react-native-elements";
import { Avatar, List } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { api_url, error } from "./Global";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Drawer() {
  const navigation = useNavigation();
  const currentRoute = navigation.getCurrentRoute();
  const params = currentRoute ? currentRoute.params ? currentRoute.params.userName ? currentRoute.params : null : null : null;

  const [login, setLogin] = useState(true);
  const [register, setRegister] = useState(true);
  const [notiCount, setNotiCount] = useState("");

  useEffect(() => {
    AsyncStorage.getItem("notiCount").then((count) => {
      count == 0
        ? setNotiCount("")
        : count > 9
          ? setNotiCount("9+")
          : setNotiCount(count);
    });

    AsyncStorage.getItem("usertype").then((usertype) => {
      const user_type = JSON.parse(usertype);
      user_type == "user"
        ? (setLogin(false),
          setRegister(false))
        : (setLogin(true),
          setRegister(true));
    });
  });

  const logout = () => {
    navigation.goBack();
    Alert.alert("", "Logout", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        onPress: async () => {
          AsyncStorage.getItem("token").then((value) => {
            const token = JSON.parse(value);
            AsyncStorage.getItem("usertype").then((value) => {
              const usertype = JSON.parse(value);

              usertype == "user"
                ? AsyncStorage.clear().then(() => {
                  navigation.navigate("Login");
                })
                : null;
            });
          });
        },
      },
    ]);
  };

  return (
    <View style={{ display: "flex" }}>
      <ListItem containerStyle={{ backgroundColor: "#262c76" }}>
        <Image
          source={require("../assets/mega-paint-logo.png")}
          style={{ width: 50, height: 50, backgroundColor: "#fff", borderRadius: 50 }}
        />
        <ListItem.Content>
          <Text
            style={{
              fontSize: 16,
              color: "#FFF",
              fontFamily: "Lexend",
            }}
          >
            {"Mega Paint Shopping"}
          </Text>
        </ListItem.Content>
      </ListItem>
      {params ?
        <View style={{ backgroundColor: "#262c76" }}>
          <Text
            onPress={() => {
              navigation.navigate("ProfileSetting");
            }}
            style={{ padding: 20, color: "#fff", fontFamily: "Lexend", fontSize: 16 }}
          >
            {params.userName}
          </Text>
        </View>
        : null}

      <List.AccordionGroup>

        <List.Item
          onPress={() => {
            navigation.navigate("Products");
          }}
          title="Products"
          left={() => (
            <View style={{ justifyContent: "center" }}>
              <Image
                style={{ height: 32, width: 32 }}
                source={require("../assets/photos/brand-icon.png")}
              // tintColor="#262c76"
              />
            </View>
          )}
          right={() => (
            <List.Icon
              color="#000"
              icon="chevron-right"
              style={{ marginRight: -2 }}
            />
          )}
          titleStyle={[styles.listText, { width: 200 }]}
          style={[styles.listItem, { paddingVertical: 0 }]}
        />

        {login
          ? null
          : (<List.Item
            onPress={() => {
              navigation.navigate("SaveCart");
            }}
            title="Save Cart"
            left={() => (
              <View style={{ justifyContent: "center" }}>
                <Image
                  style={{ height: 32, width: 32 }}
                  source={require("../assets/photos/savecart-icon.png")}
                // tintColor="#262c76"
                />
              </View>
            )}
            right={() => (
              <List.Icon
                color="#000"
                icon="chevron-right"
                style={{ marginRight: -2 }}
              />
            )}
            titleStyle={[styles.listText, { width: 200 }]}
            style={[styles.listItem, { paddingVertical: 0 }]}
          />)}

        {login
          ? null
          : (<List.Accordion
            title={"Order"}
            id="1"
            left={() => (
              <View style={{ justifyContent: "center" }}>
                <Image
                  style={{ height: 32, width: 32 }}
                  source={require("../assets/photos/order-icon.png")}
                  tintColor="#262c76"
                />
              </View>
            )}
            titleStyle={styles.listText}
            style={styles.listItem}
          >
            <List.Item
              onPress={() => navigation.navigate("OrderHistory")}
              title="Order History"
              left={() => (
                <View style={{ justifyContent: "center" }}>
                  <Image
                    style={{ height: 32, width: 32 }}
                    source={require("../assets/photos/orderhistory-icon.png")}
                  // tintColor="#262c76"
                  />
                </View>
              )}
              titleStyle={styles.listText}
              style={styles.appListItem}
            />
            <List.Item
              onPress={() => navigation.navigate("Checkout")}
              title="Order Return"
              left={() => (
                <View style={{ justifyContent: "center" }}>
                  <Image
                    style={{ height: 32, width: 32 }}
                    source={require("../assets/photos/orderreturn-icon.png")}
                  // tintColor="#262c76"
                  />
                </View>
              )}
              titleStyle={styles.listText}
              style={styles.appListItem}
            />
          </List.Accordion>)}

        {register ? (
          <List.Item
            onPress={() => {
              navigation.navigate("Register");
            }}
            title="Register/Sign Up"
            left={() => (
              <View style={{ justifyContent: "center" }}>
                <Image
                  style={{ height: 32, width: 32 }}
                  source={require("../assets/photos/register-icon.png")}
                  tintColor="#262c76"
                />
              </View>
            )}
            right={() => (
              <List.Icon
                color="#000"
                icon="chevron-right"
                style={{ marginRight: -2 }}
              />
            )}
            titleStyle={[styles.listText, { width: 200 }]}
            style={[styles.listItem, { paddingVertical: 0 }]}
          />
        ) : (
          <List.Item
            onPress={() => {
              navigation.navigate("ProfileSetting");
            }}
            title="Profile Setting"
            left={() => (
              <View style={{ justifyContent: "center" }}>
                <Image
                  style={{ height: 32, width: 32 }}
                  source={require("../assets/photos/setting-icon.png")}
                  tintColor="#262c76"
                />
              </View>
            )}
            right={() => (
              <List.Icon
                color="#000"
                icon="chevron-right"
                style={{ marginRight: -2 }}
              />
            )}
            titleStyle={[styles.listText, { width: 200 }]}
            style={[styles.listItem, { paddingVertical: 0 }]}
          />
        )}

        {login ? (
          <List.Item
            onPress={() => navigation.navigate("Login")}
            title="Login"
            left={() => (
              <View style={{ justifyContent: "center" }}>
                <Image
                  style={{ height: 32, width: 32 }}
                  source={require("../assets/photos/login-icon.png")}
                  tintColor="#262c76"
                />
              </View>
            )}
            right={() => (
              <List.Icon
                color="#000"
                icon="chevron-right"
                style={{ marginRight: -2 }}
              />
            )}
            titleStyle={[styles.listText, { width: 200 }]}
            style={[styles.listItem, { paddingVertical: 0 }]}
          />
        ) : (
          <List.Item
            onPress={() => logout()}
            title="Logout"
            left={() => (
              <View style={{ justifyContent: "center" }}>
                <Image
                  style={{ height: 32, width: 32 }}
                  source={require("../assets/photos/logout-icon.png")}
                  tintColor="#262c76"
                />
              </View>
            )}
            right={() => (
              <List.Icon
                color="#000"
                icon="chevron-right"
                style={{ marginRight: -2 }}
              />
            )}
            titleStyle={[styles.listText, { width: 200 }]}
            style={[styles.listItem, { paddingVertical: 0 }]}
          />
        )}
      </List.AccordionGroup>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  header: {
    backgroundColor: "#24b65b",
    height: 30,
    top: -15,
  },
  headerText: {
    fontSize: 16,
    fontFamily: "Lexend",
    color: "#fff",
    width: 200,
    paddingLeft: "10%",
  },
  text: {
    fontSize: 25,
    color: "#000",
  },
  appList: {
    backgroundColor: "#24b65b",
  },
  listItem: {
    backgroundColor: "#fff",
    borderStyle: "solid",
    borderColor: "#d4cfcf91",
    borderBottomWidth: 1,
  },
  appListItem: {
    paddingLeft: 50,
    paddingVertical: 5,
    backgroundColor: "#e9e9f1",
    borderStyle: "solid",
    borderColor: "#d4cfcf91",
    borderBottomWidth: 1,
  },
  listText: {
    fontSize: 14,
    fontFamily: "Lexend",
    color: "#000",
    paddingBottom: 2
  },
});
