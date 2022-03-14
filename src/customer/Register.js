import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  SafeAreaView,
  BackHandler,
  Text,
  Image,
  Alert,
  Keyboard,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import {
  Appbar,
  RadioButton,
  Checkbox,
  Button,
  Provider,
  Portal,
  Modal,
} from "react-native-paper";
import { Icon } from "react-native-elements";
import { LinearGradient } from "expo-linear-gradient";
import { FloatingLabelInput } from "react-native-floating-label-input";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import SelectDropdown from "react-native-select-dropdown";
import * as ImagePicker from "expo-image-picker";
import NetInfo from "@react-native-community/netinfo";

import Moment from "moment";
Moment.locale("en");
import { api_url, error } from "../Global";

export default function StudentRegister({ route, navigation }) {

  useEffect(() => {
    navigation.addListener("focus", () => {
      getTwonShip();
      const backAction = () => {
        if (navigation.isFocused()) {
          navigation.goBack(
            setAgreedModal(false),
            setAgreed(false));
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

  function getTwonShip() {
    setisLoading(true);
    fetch(api_url + "d/townships")
      .then((response) => response.json())
      .then((json) => {
        setDistricts(Object.keys(json));
        setLocalTown(json);
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
    password: false,
    confirmpassword: false,
    district: false,
    postalCode: false,
    address: false,
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmpassword, setConfirmPassword] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [address, setAddress] = useState("");
  const [agreedModal, setAgreedModal] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setisLoading] = useState(false);

  const [existEmail, setExistEmail] = useState(false);

  //password eye
  const [show, setShow] = useState(false);
  const [confirmShow, setConfirmShow] = useState(false);

  const emailregex = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$/;
  const phoneregex = /\+?95|0?9+[0-9]{7,10}$/;

  function submitPressed() {
    setShowError({
      name: name == "" || name.length > 100,
      email: email == "" || !emailregex.test(email),
      phone: phone == "" || !phoneregex.test(phone),
      password: password == "" || password.length < 8 || password.length > 20,
      confirmpassword: confirmpassword == "" || confirmpassword != password,
      district: district == "",
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
      password == "" ||
      password.length < 8 ||
      password.length > 20 ||
      confirmpassword == "" ||
      confirmpassword != password ||
      district == "" ||
      postalCode == "" ||
      postalCode.length > 100 ||
      address == "" ||
      address.length > 200
      ? null
      : NetInfo.fetch().then((state) => {
        state.isConnected
          ? userRegister()
          : Alert.alert("", "Please check your internet connection", [
            {
              text: "OK",
            },
          ]);
      });
  }

  function userRegister() {
    setisLoading(true);

    let registerData = {
      name: name,
      email: email,
      password: password,
      confirm_password: confirmpassword,
      phone_no: phone,
      city: district,
      township: township,
      postal_code: postalCode,
      address: address,
    };

    fetch(api_url + "register", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registerData),
    })
      .then((response) => response.json())
      .then((json) => {
        let message = "";
        json.errors
          ? (json.errors.hasOwnProperty("email")
            ? ((message = json.errors.email[0]), setExistEmail(true))
            : null,
            json.errors.hasOwnProperty("profile")
              ? (message = json.errors.profile[0])
              : null,
            Alert.alert("Fail", message, [{ text: "OK" }]))
          : (Alert.alert(
            "",
            message,
            [
              {
                text: "OK",
              },
            ]
          ),
            navigation.navigate("Login"));
        setisLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setisLoading(false);
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
            {
              navigation.goBack();
              setAgreedModal(false);
              setAgreed(false);
            }
          }}
        />
        <Appbar.Content
          title={"Register"}
          titleStyle={styles.headerTitle}
          style={styles.headers}
        />
        <Appbar.Action />
      </Appbar>

      {agreedModal ? (
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps={"handled"}
          >
            <SafeAreaView style={styles.container}>
              <View style={styles.logoBG}>
                <Image
                  source={require("../../assets/mega-paint-logo.png")}
                  style={styles.logoImg}
                />
              </View>
              <View>
                <View style={{ marginVertical: 10 }}>
                  <FloatingLabelInput
                    containerStyles={styles.inputBorder}
                    label={"Name"}
                    customLabelStyles={{
                      colorFocused: "#262c76",
                      colorBlurred: "#262c76",
                    }}
                    labelStyles={{ fontFamily: "Lexend" }}
                    inputStyles={{
                      color: "#262c76",
                      paddingTop: 15,
                      fontFamily: "Lexend",
                      fontSize: 16,
                    }}
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

                <View style={{ marginVertical: 10 }}>
                  <FloatingLabelInput
                    containerStyles={styles.inputBorder}
                    label={"Email"}
                    keyboardType="email-address"
                    customLabelStyles={{
                      colorFocused: "#262c76",
                      colorBlurred: "#262c76",
                    }}
                    labelStyles={{ fontFamily: "Lexend" }}
                    inputStyles={{
                      color: "#262c76",
                      paddingTop: 15,
                      fontFamily: "Lexend",
                      fontSize: 16,
                    }}
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

                <View style={{ marginVertical: 10 }}>
                  <FloatingLabelInput
                    containerStyles={styles.inputBorder}
                    label={"Phone Number"}
                    keyboardType="numeric"
                    customLabelStyles={{
                      colorFocused: "#262c76",
                      colorBlurred: "#262c76",
                    }}
                    labelStyles={{ fontFamily: "Lexend" }}
                    inputStyles={{
                      color: "#262c76",
                      paddingTop: 15,
                      fontFamily: "Lexend",
                      fontSize: 16,
                    }}
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

                <View style={{ marginVertical: 10 }}>
                  <FloatingLabelInput
                    containerStyles={styles.inputBorder}
                    label={"Password"}
                    customLabelStyles={{
                      colorFocused: "#262c76",
                      colorBlurred: "#262c76",
                    }}
                    labelStyles={{ fontFamily: "Lexend" }}
                    inputStyles={{
                      color: "#262c76",
                      paddingTop: 15,
                      fontFamily: "Lexend",
                      fontSize: 16,
                    }}
                    isPassword
                    togglePassword={show}
                    value={password}
                    onChangeText={(value) => setPassword(value)}
                    customShowPasswordComponent={
                      <Icon name={"visibility-off"} size={20} color="#262c76" />
                    }
                    customHidePasswordComponent={
                      <Icon name={"visibility"} size={20} color="#262c76" />
                    }
                  />
                  {showError.password ? (
                    password == "" ? (
                      <Text style={styles.errorTextStyle}>
                        Password {error.require_error}
                      </Text>
                    ) : password.length < 8 || password.length > 20 ? (
                      <Text style={styles.errorTextStyle}>
                        Password {error.at_least_8_or_most_20_error}
                      </Text>
                    ) : null
                  ) : null}
                </View>
                <View style={{ marginVertical: 10 }}>
                  <FloatingLabelInput
                    containerStyles={styles.inputBorder}
                    label={"Confirm Password"}
                    customLabelStyles={{
                      colorFocused: "#262c76",
                      colorBlurred: "#262c76",
                    }}
                    labelStyles={{ fontFamily: "Lexend" }}
                    inputStyles={{
                      color: "#262c76",
                      paddingTop: 15,
                      fontFamily: "Lexend",
                      fontSize: 16,
                    }}
                    isPassword
                    togglePassword={confirmShow}
                    value={confirmpassword}
                    onChangeText={(value) => setConfirmPassword(value)}
                    customShowPasswordComponent={
                      <Icon name={"visibility-off"} size={20} color="#262c76" />
                    }
                    customHidePasswordComponent={
                      <Icon name={"visibility"} size={20} color="#262c76" />
                    }
                  />
                  {showError.confirmpassword ? (
                    confirmpassword == "" ? (
                      <Text style={styles.errorTextStyle}>
                        Confirm Password {error.require_error}
                      </Text>
                    ) : confirmpassword != password ? (
                      <Text style={styles.errorTextStyle}>
                        Confirm Password {error.password_do_not_match_error}
                      </Text>
                    ) : null
                  ) : null}
                </View>

                <View style={{ marginVertical: 10 }}>
                  <Text
                    style={styles.nameInput}
                    onPress={() => districtDropdownRef.current.openDropdown()}
                  >
                    <FloatingLabelInput
                      containerStyles={[styles.inputBorder, { width: "100%" }]}
                      label={"City"}
                      customLabelStyles={{
                        colorFocused: "#262c76",
                        colorBlurred: "#262c76",
                      }}
                      labelStyles={{ fontFamily: "Lexend" }}
                      inputStyles={{
                        color: "#262c76",
                        paddingTop: 20,
                        fontFamily: "Lexend",
                        fontSize: 16,
                      }}
                      value={district}
                      onChangeText={(value) => setDistrictName(value)}
                    />
                  </Text>
                  <Text
                    style={{
                      position: "absolute",
                      alignSelf: "flex-end",
                      top: 10,
                    }}
                  >
                    <Icon name={"arrow-drop-down"} size={20} color="#ccc" />
                  </Text>

                  <SelectDropdown
                    data={districts}
                    ref={districtDropdownRef}
                    onSelect={(selectedItem, index) => {
                      setDistrictName(selectedItem);
                      onRegionChange(selectedItem, index);
                    }}
                    buttonStyle={styles.dropdownBtnStyle}
                    rowTextStyle={styles.dropdownRowTextStyle}
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
                <View style={{ marginVertical: 10 }}>
                  <Text
                    style={[
                      styles.nameInput,
                      {
                        borderBottomColor: townshipListEnable ? "#aaa" : "#262c76",
                      },
                    ]}
                    onPress={() =>
                      townshipListEnable
                        ? null
                        : townshipDropdownRef.current.openDropdown()
                    }
                  >
                    <FloatingLabelInput
                      containerStyles={[styles.inputBorder, { width: "100%" }]}
                      label={"Township"}
                      customLabelStyles={{
                        colorFocused: "#262c76",
                        colorBlurred: townshipListEnable ? "#aaa" : "#262c76",
                      }}
                      labelStyles={{ fontFamily: "Lexend" }}
                      inputStyles={{
                        color: "#262c76",
                        paddingTop: 20,
                        fontFamily: "Lexend",
                        fontSize: 16,
                      }}
                      value={township}
                      onChangeText={(value) => setTownShipName(value)}
                    />
                  </Text>
                  <Text
                    style={{
                      position: "absolute",
                      alignSelf: "flex-end",
                      top: 10,
                    }}
                  >
                    <Icon
                      name={"arrow-drop-down"}
                      size={20}
                      color={townshipListEnable ? "#aaa" : "#ccc"}
                    />
                  </Text>
                  <SelectDropdown
                    disabled={townshipListEnable}
                    data={townshipList}
                    ref={townshipDropdownRef}
                    onSelect={(selectedItem) => {
                      onTownshipChange(selectedItem);
                    }}
                    buttonStyle={styles.dropdownBtnStyle}
                    rowTextStyle={styles.dropdownRowTextStyle}
                    dropdownStyle={styles.dropdownDropdownStyle}
                  />
                </View>

                <View style={{ marginVertical: 10 }}>
                  <FloatingLabelInput
                    containerStyles={styles.inputBorder}
                    label={"Postal Code"}
                    keyboardType="numeric"
                    maxLength={5}
                    customLabelStyles={{
                      colorFocused: "#262c76",
                      colorBlurred: "#262c76",
                    }}
                    labelStyles={{ fontFamily: "Lexend" }}
                    inputStyles={{
                      color: "#262c76",
                      paddingTop: 15,
                      fontFamily: "Lexend",
                      fontSize: 16,
                    }}
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

                <View style={{ marginVertical: 10 }}>
                  <FloatingLabelInput
                    containerStyles={styles.inputBorder}
                    label={"Address"}
                    multiline={true}
                    customLabelStyles={{
                      colorFocused: "#262c76",
                      colorBlurred: "#262c76",
                    }}
                    labelStyles={{ fontFamily: "Lexend" }}
                    inputStyles={{
                      color: "#262c76",
                      paddingTop: 15,
                      fontFamily: "Lexend",
                      fontSize: 16,
                    }}
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

                <View style={{ marginVertical: 20 }}>
                  <Button
                    mode="contained"
                    color={"#262c76"}
                    labelStyle={{ fontFamily: "Lexend", fontSize: 16 }}
                    onPress={() => submitPressed()}
                  >
                    Register
                  </Button>
                </View>
              </View>
            </SafeAreaView>
          </ScrollView>
          <Provider>
            <Portal>
              <Modal
                visible={isLoading}
                dismissable={false}
                contentContainerStyle={{ alignItems: "center" }}
              >
                <View style={styles.loading}>
                  <ActivityIndicator size="large" color="#262c76" />
                  <Text
                    style={{
                      marginTop: 10,
                      marginLeft: 20,
                      fontFamily: "Lexend",
                      fontSize: 16,
                    }}
                  >
                    Please Wait
                  </Text>
                </View>
              </Modal>
            </Portal>
          </Provider>
        </SafeAreaView>
      ) : (
        <SafeAreaView style={styles.container}>
          <View
            style={{
              alignSelf: "center",
              marginVertical: 20,
              flexDirection: "row",
            }}
          >
            <Image
              source={require("../../assets/mega-paint-logo.png")}
              style={{ width: 27, height: 27 }}
            />
            <Text style={styles.titletext}>
              Terms And Conditions
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.aboutText}>
              <Text style={styles.text}>
                1. Aliqua qui et amet esse.
              </Text>
              <Text style={styles.text}>
                2. Nulla proident adipisicing et non.
              </Text>
              <Text style={styles.text}>
                3. Officia irure Lorem ex consectetur qui anim excepteur Lorem nulla anim velit incididunt aliqua.
              </Text>
              <Text style={styles.text}>
                4. Labore consectetur magna in do sit ad sint.
              </Text>
              <Text style={styles.text}>
                5. Ea irure et do pariatur.
              </Text>
              <Text style={styles.text}>
                6. Irure eu ipsum non enim commodo ipsum.
              </Text>
              <Text style={styles.text}>
                7. Lorem ipsum commodo qui deserunt anim aliqua qui sit anim non do exercitation in.
              </Text>
            </View>
          </ScrollView>

          <View style={{ margin: 20, alignSelf: "center", width: "90%" }}>
            <View style={{ flexDirection: "row", marginBottom: 5 }}>
              <Checkbox
                status={agreed ? "checked" : "unchecked"}
                color="#262c76"
                onPress={() => {
                  setAgreed(!agreed);
                }}
              />
              <Text style={styles.checkText}>
                Agreed
                <Text style={{ color: "#262c76" }}>
                  {" Terms And Conditions"}
                </Text>
              </Text>
            </View>
            <Button
              mode="contained"
              disabled={!agreed}
              color={"#262c76"}
              labelStyle={{ fontFamily: "Lexend" }}
              style={{ borderRadius: 50 }}
              onPress={() => setAgreedModal(true)}
            >
              Agreed
            </Button>
          </View>
        </SafeAreaView>
      )}
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
  },
  logoImg: {
    width: 120,
    height: 120,
    zIndex: 1,
  },
  inputBorder: {
    flexDirection: "row",
    borderBottomColor: "#262c76",
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  textInput: {
    width: "90%",
    height: 50,
    color: "#262c76",
  },
  pwdIcon: { position: "absolute", right: 10, paddingTop: 15 },
  errorTextStyle: {
    fontSize: 12,
    color: "#fff",
    backgroundColor: "#e60012",
    padding: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  nameInput: {
    zIndex: 1,
    flexDirection: "row",
    borderBottomColor: "#262c76",
    borderBottomWidth: 1,
    marginBottom: 10,
  },

  dropdownBtnStyle: {
    backgroundColor: "transparent",
    width: "100%",
    height: 0,
  },
  dropdownRowTextStyle: {
    fontSize: 16,
    fontFamily: "Lexend",
  },
  dropdownDropdownStyle: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
  },
  loading: {
    flexDirection: "row",
    backgroundColor: "white",
    justifyContent: "center",
    padding: 20,
    width: 170,
  },

  titletext: {
    fontSize: 17,
    color: "#262c76",
    marginLeft: 5,
    fontFamily: "LexendBold",
  },

  aboutText: {
    paddingHorizontal: 10,
  },
  text: {
    color: "#000000",
    fontSize: 15,
    fontFamily: "Lexend",
    marginBottom: 5,
  },
  checkText: {
    marginTop: 8,
    color: "#000",
    fontFamily: "Lexend",
  },
});
