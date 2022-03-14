import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  SafeAreaView,
  Text,
  TextInput,
  Image,
  Alert,
  Keyboard,
  Pressable,
  Modal,
  BackHandler,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Appbar, RadioButton, Button, } from "react-native-paper";
import { Icon } from "react-native-elements";
import SelectDropdown from "react-native-select-dropdown";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Moment from "moment";
Moment.locale("en");
import { api_url, error } from "../Global";

export default function StudentProfile({ route, navigation }) {

  const [edit, setEdit] = useState(false);
  const [userData, setUserData] = useState({});

  useEffect(() => {
    navigation.addListener("focus", () => {
      AsyncStorage.getItem("token").then((value) => {
        const token = JSON.parse(value);
        NetInfo.fetch().then((state) => {
          state.isConnected
            ? userInformation(token)
            : Alert.alert("", "Please check your internet connection", [
              {
                text: "OK",
              },
            ]);
        });
      });

      const backAction = () => {
        if (navigation.isFocused()) {
          navigation.goBack(setEdit(false));
          return true;
        }
      };
      BackHandler.addEventListener("hardwareBackPress", backAction);
      return () =>
        BackHandler.removeEventListener("hardwareBackPress", backAction);
    });
  }, [navigation]);

  const [districts, setDistricts] = useState([]);
  const [localTown, setLocalTown] = useState([]);

  function userInformation(token) {
    setisLoading(true);
    fetch(api_url + "profile", {
      headers: {
        Authorization: "Bearer " + token,
      },
    })
      .then((response) => response.json())
      .then((json) => {
        setUserData(json);

        setName(json.name);
        setEmail(json.email);
        setPhone(json.phone_no);
        setDistrictName(json.city);
        setTownShipName(json.township);
        setPostalCode(json.postal_code);
        setAddress(json.address);

        getTwonShip(json.city);

        setisLoading(false);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  function getTwonShip(city) {
    setisLoading(true);
    fetch(api_url + "d/townships")
      .then((response) => response.json())
      .then((json) => {
        setDistricts(Object.keys(json));
        setLocalTown(json);

        let CityName = json[city].map(function (n) {
          return n.township;
        });
        setTownShipList(CityName);

        setisLoading(false);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  const [showError, setShowError] = useState({
    name: false,
    email: false,
    phone: false,
    district: false,
    township: false,
    postalCode: false,
    address: false,
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [address, setAddress] = useState("");
  const [isLoading, setisLoading] = useState(false);

  const [existEmail, setExistEmail] = useState(false);

  const emailregex = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$/;
  const phoneregex = /\+?95|0?9+[0-9]{7,10}$/;

  function submitPressed() {
    setShowError({
      name: name == "" || name.length > 100,
      email: email == "" || !emailregex.test(email),
      phone: phone == "" || !phoneregex.test(phone),
      district: district == "",
      township: township == "",
      postalCode: postalCode == "" || postalCode.length > 100,
      address: address == "" || address.length > 200,
    });

    Keyboard.dismiss();

    name == "" ||
      name.length > 100 ||
      email == "" ||
      !emailregex.test(email) ||
      phone == "" ||
      !phoneregex.test(phone) ||
      district == "" ||
      township == "" ||
      postalCode == "" ||
      postalCode.length > 100 ||
      address == "" ||
      address.length > 200
      ? null
      : NetInfo.fetch().then((state) => {
        state.isConnected
          ? studentUpdate()
          : Alert.alert("", "Please check your internet connection", [
            {
              text: "OK",
            },
          ]);
      });
  }

  function studentUpdate() {
    setisLoading(true);

    let updateData = {
      name: name,
      email: email,
      phone_no: phone,
      city: district,
      township: township,
      postal_code: postalCode,
      address: address,
    };

    AsyncStorage.getItem("token").then((value) => {
      const token = JSON.parse(value);

      fetch(api_url + "profile/update", {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(updateData),
      })
        .then((response) => response.json())
        .then((json) => {
          let message = "";
          json.status
            ? (Alert.alert("", json.message, [
              { text: "OK" },
            ]),
              setEdit(false),
              setExistEmail(false),
              navigation.navigate("ProfileSetting"))
            : (json.errors
              ? (json.errors.hasOwnProperty("email") ? ((message = json.errors.email[0]), setExistEmail(true)) : null)
              : Alert.alert("", json.message, [{ text: "OK" }]));

          setisLoading(false);
        })
        .catch((error) => {
          console.error(error);
          setisLoading(false);
        });
    });
  }

  const districtDropdownRef = useRef({});
  const townshipDropdownRef = useRef({});
  const [district, setDistrictName] = useState("");

  //township
  const [townshipListEnable, setTownShipListEnable] = useState(true);
  const [townshipList, setTownShipList] = useState([]);
  const [township, setTownShipName] = useState("");

  //change region
  const onRegionChange = (districtName, index) => {
    setDistrictName(districtName);

    townshipDropdownRef.current.reset();
    setTownShipListEnable(false);
    let CityName = localTown[districtName].map(function (n) {
      return n.township;
    });
    setTownShipList(CityName);
    setTownShipName("");
  };
  //township change
  const onTownshipChange = (townshipName) => {
    setTownShipName(townshipName);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Appbar style={styles.topBar}>
        <Appbar.Action
          icon="arrow-left"
          onPress={() => {
            navigation.goBack();
            setEdit(false);
          }}
        />
        <Appbar.Content
          title={"Profile"}
          titleStyle={styles.headerTitle}
          style={styles.headers}
        />
        <Appbar.Action
          icon="square-edit-outline"
          onPress={() => {
            setEdit(true);
          }}
        />
      </Appbar>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps={"handled"}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.logoBG}>
            <Image
              resizeMode="cover"
              style={styles.logoImg}
              source={{ uri: userData.image_path }}
            />
          </View>

          <View style={{ marginVertical: 15 }}>
            <Text>Name</Text>
            {edit ? (
              <View>
                <TextInput
                  style={styles.textInput}
                  placeholderTextColor="#888888"
                  placeholder="Name"
                  value={name}
                  onChangeText={(value) => setName(value)}
                />
                {showError.name ? (
                  name == "" ? (
                    <Text style={styles.errorTextStyle}>
                      Name {error.require_error}
                    </Text>
                  ) : name.length > 100 ? (
                    <Text style={styles.errorTextStyle}>
                      {error.maximum_length_100_error}
                    </Text>
                  ) : null
                ) : null}
              </View>
            ) : (
              <Text style={styles.userdata}>{userData.name}</Text>
            )}
          </View>

          <View style={{ marginVertical: 15 }}>
            <Text>Email</Text>
            {edit ? (
              <View>
                <TextInput
                  style={styles.textInput}
                  placeholderTextColor="#888888"
                  placeholder="Email"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    setExistEmail(false);
                  }}
                />
                {showError.email ? (
                  email == "" ? (
                    <Text style={styles.errorTextStyle}>
                      Email {error.require_error}
                    </Text>
                  ) : !emailregex.test(email) ? (
                    <Text style={styles.errorTextStyle}>
                      Email {error.pattern_error}
                    </Text>
                  ) : null
                ) : existEmail ? (
                  <Text style={styles.errorTextStyle}>
                    {"Email already exist."}
                  </Text>
                ) : null}
              </View>
            ) : (
              <Text style={styles.userdata}>{userData.email}</Text>
            )}
          </View>

          <View style={{ marginVertical: 15 }}>
            <Text>Phone Number</Text>
            {edit ? (
              <View>
                <TextInput
                  style={styles.textInput}
                  placeholderTextColor="#888888"
                  placeholder="Phone Number"
                  keyboardType="numeric"
                  maxLength={20}
                  value={phone}
                  onChangeText={(value) => setPhone(value)}
                />
                {showError.phone ? (
                  phone == "" ? (
                    <Text style={styles.errorTextStyle}>
                      Phone Number {error.require_error}
                    </Text>
                  ) : !phoneregex.test(phone) ? (
                    <Text style={styles.errorTextStyle}>
                      Phone Number {error.pattern_error}
                    </Text>
                  ) : null
                ) : null}
              </View>
            ) : (
              <Text style={styles.userdata}>
                {userData.phone_no}
              </Text>
            )}
          </View>

          <View style={{ marginVertical: 15 }}>
            <Text>City</Text>
            {edit ? (
              <View>
                <SelectDropdown
                  defaultValue={district}
                  data={districts}
                  ref={districtDropdownRef}
                  onSelect={(selectedItem, index) => {
                    onRegionChange(selectedItem, index);
                  }}
                  defaultButtonText="City"
                  buttonStyle={styles.dropdownBtnStyle}
                  buttonTextStyle={[
                    styles.dropdownBtnTextStyle,
                    { color: district ? "#262c76" : "#888888" },
                  ]}
                  dropdownIconPosition="right"
                  rowTextStyle={styles.dropdownRowTextStyle}
                  renderDropdownIcon={() => {
                    return (
                      <Icon name={"arrow-drop-down"} size={25} color="#aaa" />
                    );
                  }}
                  dropdownStyle={styles.dropdownDropdownStyle}
                />
                {showError.district ? (
                  district == "" ? (
                    <Text style={styles.errorTextStyle}>
                      City {error.require_error}
                    </Text>
                  ) : null
                ) : null}
              </View>
            ) : (
              <Text style={styles.userdata}>
                {userData.city}
              </Text>
            )}
          </View>
          {userData.township || edit ? (
            <View style={{ marginVertical: 15 }}>
              <Text>Township</Text>
              {edit ? (
                <View>
                  <SelectDropdown
                    defaultValue={township}
                    data={townshipList}
                    ref={townshipDropdownRef}
                    onSelect={(selectedItem) => {
                      onTownshipChange(selectedItem);
                    }}
                    defaultButtonText="Township"
                    buttonStyle={styles.dropdownBtnStyle}
                    buttonTextStyle={[
                      styles.dropdownBtnTextStyle,
                      { color: township ? "#262c76" : "#888888" },
                    ]}
                    dropdownIconPosition="right"
                    renderDropdownIcon={() => {
                      return (
                        <Icon name={"arrow-drop-down"} size={25} color="#aaa" />
                      );
                    }}
                    rowTextStyle={styles.dropdownRowTextStyle}
                    dropdownStyle={styles.dropdownDropdownStyle}
                  />
                  {showError.township ? (
                    township == "" ? (
                      <Text style={styles.errorTextStyle}>
                        Township {error.require_error}
                      </Text>
                    ) : null
                  ) : null}
                </View>
              ) : (
                <Text style={styles.userdata}>{userData.township}</Text>
              )}
            </View>
          ) : null}

          <View style={{ marginVertical: 15 }}>
            <Text>Postal Code</Text>
            {edit ? (
              <View>
                <TextInput
                  style={styles.textInput}
                  placeholderTextColor="#888888"
                  placeholder="Postal Code"
                  keyboardType="numeric"
                  maxLength={5}
                  value={postalCode}
                  onChangeText={(value) => setPostalCode(value)}
                />
                {showError.postalCode ? (
                  postalCode == "" ? (
                    <Text style={styles.errorTextStyle}>
                      Postal Code {error.require_error}
                    </Text>
                  ) : postalCode.length > 100 ? (
                    <Text style={styles.errorTextStyle}>
                      Postal Code {error.maximum_length_100_error}
                    </Text>
                  ) : null
                ) : null}
              </View>
            ) : (
              <Text style={styles.userdata}>{userData.postal_code}</Text>
            )}
          </View>

          <View style={{ marginVertical: 15 }}>
            <Text>Address</Text>
            {edit ? (
              <View>
                <TextInput
                  style={[styles.textInput, styles.textarea]}
                  placeholderTextColor="#888888"
                  placeholder="Address"
                  multiline={true}
                  value={address}
                  onChangeText={(value) => setAddress(value)}
                />
                {showError.address ? (
                  address == "" ? (
                    <Text style={styles.errorTextStyle}>
                      Address {error.require_error}
                    </Text>
                  ) : address.length > 200 ? (
                    <Text style={styles.errorTextStyle}>
                      Address {error.maximum_length_200_error}
                    </Text>
                  ) : null
                ) : null}
              </View>
            ) : (
              <Text style={styles.userdata}>{userData.address}</Text>
            )}
          </View>

          {edit ? (
            <View style={{ marginVertical: 15 }}>
              <Button
                mode="contained"
                color={"#262c76"}
                onPress={() => submitPressed()}
              >
                Update
              </Button>
            </View>
          ) : null}
        </SafeAreaView>
      </ScrollView>

      <Modal visible={isLoading} transparent={true}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            backgroundColor: "rgba(1,1,1,0.3)",
          }}
        >
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#262c76" />
            <Text style={{ marginTop: 8, marginLeft: 20, fontFamily: "Lexend" }}>
              Please Wait
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: "center",
    margin: 20,
  },
  topBar: {
    backgroundColor: "#262c76",
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Lexend",
    color: "#fff",
    textAlign: "center",
    padding: 0,
  },
  logoBG: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoImg: {
    width: 120,
    height: 120,
    zIndex: 1,
    borderRadius: 100,
  },
  profile: {
    backgroundColor: "#ccc",
    borderRadius: 100,
    padding: 40,
  },
  chooseProfile: {
    marginTop: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 15,
  },
  textInput: {
    marginTop: 5,
    paddingHorizontal: 10,
    paddingBottom: 2,
    height: 40,
    color: "#262c76",
    borderColor: "#262c76",
    borderWidth: 1,
    borderRadius: 5,
    fontFamily: "Lexend"
  },
  textarea: {
    padding: 10,
    height: 100,
    textAlignVertical: "top",
  },
  errorTextStyle: {
    fontSize: 12,
    fontFamily: "Lexend",
    color: "#ff0000",
    padding: 2,
    marginTop: 8,
    alignSelf: "flex-start",
  },

  dropdownBtnStyle: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#aaa",
    marginTop: 5,
    borderRadius: 5,
    width: "100%",
    height: 40,
  },
  dropdownBtnTextStyle: {
    fontSize: 16,
    fontFamily: "Lexend",
    textAlign: "left",
    marginLeft: 0,
    paddingBottom: 2
  },
  dropdownRowTextStyle: {
    fontSize: 16,
  },
  dropdownDropdownStyle: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
  },
  loading: {
    flexDirection: "row",
    backgroundColor: "white",
    alignSelf: "center",
    padding: 20,
    width: 170,
    borderRadius: 5
  },
  userdata: {
    color: "#262c76",
    marginTop: 5,
    fontSize: 16,
    fontFamily: "Lexend"
  },
});
