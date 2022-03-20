import React from "react";
import {
  View,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  Image,
  Keyboard,
  Alert,
  Dimensions,
  Text,
  TextInput,
  Modal,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { Appbar, Avatar, Button, Card, List } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api_url, error } from "../Global";

class ProductList extends React.Component {
  constructor(props) {
    super(props);

    this.navigation = this.props.navigation;
    this.emailregex = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$/;
    this.phoneregex = /\+?95|0?9+[0-9]{7,10}$/;

    this.state = {
      package: [],
      tax: "",
      subTotal: "",

      contactEmail: "",
      name: "",
      email: "",
      phone: "",
      address: "",
      postalCode: "",

      showError: {
        contactEmail: "",
        name: "",
        email: "",
        phone: "",
        address: "",
        postalCode: "",
      },
      // refreshing: true,
    };
  }

  componentDidMount() {
    this.navigation.addListener("focus", () => {
      this.setState({ package: [], refreshing: true });
      AsyncStorage.getItem("token").then((value) => {
        const token = JSON.parse(value);

        this.fetchCarts();
      })
    });
  }

  fetchCarts() {
    AsyncStorage.getItem("cart").then((cartLists) => {
      var cartList = JSON.parse(cartLists);

      if (cartList) {
        var priceArray = [];
        cartList.map((cartList) => {
          priceArray.push(parseFloat(cartList.price.replace(/,/g, '')) * cartList.quantity);
        })
        var sum = priceArray.reduce((a, b) => a + b, 0);
        this.setState({ subTotal: sum });
        this.taxCalculate(sum);
      }

      this.setState({
        package: cartList,
        refreshing: false,
      });
    });
  }

  taxCalculate(total) {
    fetch(api_url + "d/tax/calculate", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ total: total }),
    })
      .then((response) => response.json())
      .then((json) => {
        this.setState({ tax: json });
      })
      .catch((error) => {
        console.log("Data fetching failed");
      });
  }

  submitPressed() {
    this.setState({
      showError: {
        contactEmail: this.state.contactEmail == "" || !this.emailregex.test(this.state.contactEmail),
        name: this.state.name == "" || this.state.name.length > 100,
        email: this.state.email == "" || !this.emailregex.test(this.state.email),
        phone: this.state.phone == "" || !this.phoneregex.test(phone),
        address: this.state.address == "" || this.state.address.length > 200,
        //   district: district == "",
        //   township: township == "",
        postalCode: this.state.postalCode == "" || this.state.postalCode.length > 100,
      }
    });

    Keyboard.dismiss();

    this.state.contactEmail == "" ||
      !this.emailregex.test(this.state.contactEmail) ||
      this.state.name == "" ||
      this.state.name.length > 100 ||
      this.state.email == "" ||
      !this.emailregex.test(this.state.email) ||
      this.state.phone == "" ||
      !this.phoneregex.test(phone) ||
      this.state.address == "" ||
      this.state.address.length > 200 ||
      // district == "" ||
      // township == "" ||
      this.state.postalCode == "" ||
      this.state.postalCode.length > 100
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

  render() {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View>
          <Appbar style={styles.header}>
            <Appbar.Action
              icon="arrow-left"
              onPress={() => {
                this.navigation.goBack();
              }}
            />
            <Appbar.Content
              title="Checkout"
              titleStyle={styles.headerTitle}
              style={styles.headers}
            />
            <Appbar.Action />
          </Appbar>
        </View>
        <View style={styles.container}>
          {this.state.refreshing ? (
            <ActivityIndicator color="#262c76" size="large" />
          ) : (
            <SafeAreaView style={{ flex: 1 }}>
              <View>
                <Text style={styles.title}>Your Order List</Text>
                <View style={{ borderWidth: 1, borderRadius: 4, margin: 10 }}>
                  {this.state.package.map((item, index) =>
                    <View key={index} style={{ padding: 5 }}>
                      <Text
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {item.product_name}{item.display_name ? " (" + item.display_name + ")" : null}
                      </Text>
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={{ color: "#262c76", fontFamily: "Lexend" }}>{item.price + "Ks  x " + item.quantity}</Text>
                        <Text style={{ color: "#262c76", fontFamily: "Lexend" }}>{(item.price.replace(/,/g, '') * item.quantity).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}{" Ks"}</Text>
                      </View>
                    </View>
                  )}
                  <View style={{ borderStyle: "dashed", borderRadius: 1, borderWidth: 0.7 }}></View>
                  <View style={styles.fixToText}>
                    <Text style={styles.leftText}>{"Sub-Total:  "}</Text>
                    <Text style={styles.rightText}>{this.state.subTotal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}{" Ks"}</Text>
                  </View>
                  <View style={styles.fixToText}>
                    <Text style={styles.leftText}>{"Taxes:  "}</Text>
                    <Text style={styles.rightText}>{this.state.tax.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}{" Ks"}</Text>
                  </View>
                  <View style={{ borderStyle: "dashed", borderRadius: 1, borderWidth: 0.7 }}></View>
                  <View style={styles.fixToText}>
                    <Text style={styles.leftText}>{"Total:  "}</Text>
                    <Text style={styles.rightText}>{(this.state.subTotal + this.state.tax).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}{" Ks"}</Text>
                  </View>
                </View>
              </View>
              <View>
                <Text style={styles.title}>Contact Information</Text>
                <View style={{ margin: 10 }}>
                  <Text style={{ fontFamily: "Lexend", marginBottom: 5 }}>
                    {"Already have an account? "}
                    {/* <TouchableOpacity> */}
                    <Text onPress={() => this.navigation.navigate("Login")} style={{ color: "#262c76", fontFamily: "Lexend" }}>
                      Login
                    </Text>
                  </Text>
                  <View>
                    <TextInput
                      style={styles.textInput}
                      placeholderTextColor="#888888"
                      placeholder="Contact Email"
                      keyboardType="email-address"
                      value={this.state.contactEmail}
                      onChangeText={(value) => this.setState({ contactEmail: value })}
                    />
                    {this.state.showError.contactEmail ? (
                      this.state.contactEmail == "" ? (
                        <Text style={styles.errorTextStyle}>
                          Contact Email {error.require_error}
                        </Text>
                      ) : !this.emailregex.test(this.state.contactEmail) ? (
                        <Text style={styles.errorTextStyle}>
                          Contact Email {error.pattern_error}
                        </Text>
                      ) : null
                    ) : null}
                  </View>

                  {/* </TouchableOpacity> */}
                </View>
              </View>
              <View>
                <Text style={styles.title}>Shipping Address</Text>
                <View style={{ margin: 10 }}>
                  <View>
                    <Text>Customer Name</Text>
                    <View>
                      <TextInput
                        style={styles.textInput}
                        placeholderTextColor="#888888"
                        placeholder="Name"
                        // value={name}
                        onChangeText={(value) => this.setState({ name: value })}
                      />
                      {this.state.showError.name ? (
                        this.state.name == "" ? (
                          <Text style={styles.errorTextStyle}>
                            Name {error.require_error}
                          </Text>
                        ) : this.state.name.length > 100 ? (
                          <Text style={styles.errorTextStyle}>
                            Name {error.maximum_length_100_error}
                          </Text>
                        ) : null
                      ) : null}
                    </View>
                  </View>

                  <View style={{ marginVertical: 15 }}>
                    <Text>Email</Text>
                    <View>
                      <TextInput
                        style={styles.textInput}
                        placeholderTextColor="#888888"
                        placeholder="Email"
                        value={this.state.email}
                        onChangeText={(value) => this.setState({ email: value })}
                      />
                      {this.state.showError.email ? (
                        this.state.email == "" ? (
                          <Text style={styles.errorTextStyle}>
                            Email {error.require_error}
                          </Text>
                        ) : !this.emailregex.test(this.state.email) ? (
                          <Text style={styles.errorTextStyle}>
                            Email {error.pattern_error}
                          </Text>
                        ) : null
                      ) : null}
                    </View>
                  </View>

                  <View style={{ marginBottom: 15 }}>
                    <Text>Phone Number</Text>
                    <View>
                      <TextInput
                        style={styles.textInput}
                        placeholderTextColor="#888888"
                        placeholder="Phone Number"
                        keyboardType="numeric"
                        maxLength={20}
                        value={this.state.phone}
                        onChangeText={(value) => this.setState({ phone: value })}
                      />
                      {this.state.showError.phone ? (
                        this.state.phone == "" ? (
                          <Text style={styles.errorTextStyle}>
                            Phone Number {error.require_error}
                          </Text>
                        ) : !this.phoneregex.test(this.state.phone) ? (
                          <Text style={styles.errorTextStyle}>
                            Phone Number {error.pattern_error}
                          </Text>
                        ) : null
                      ) : null}
                    </View>
                  </View>

                  <View style={{ marginBottom: 15 }}>
                    <Text>Address</Text>
                    <View>
                      <TextInput
                        style={[styles.textInput, styles.textarea]}
                        placeholderTextColor="#888888"
                        placeholder="Address"
                        multiline={true}
                        value={this.state.address}
                        onChangeText={(value) => this.setState({ address: value })}
                      />
                      {this.state.showError.address ? (
                        this.state.address == "" ? (
                          <Text style={styles.errorTextStyle}>
                            Address {error.require_error}
                          </Text>
                        ) : this.state.address.length > 200 ? (
                          <Text style={styles.errorTextStyle}>
                            Address {error.maximum_length_200_error}
                          </Text>
                        ) : null
                      ) : null}
                    </View>
                  </View>

                  {/* <View style={{ marginBottom: 15 }}>
                    <Text>Region</Text>
                    <View>
                      <SelectDropdown
                        defaultValue={district}
                        data={districts}
                        ref={districtDropdownRef}
                        onSelect={(selectedItem, index) => {
                          onRegionChange(selectedItem, index);
                        }}
                        defaultButtonText="Region"
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
                            Region {error.require_error}
                          </Text>
                        ) : null
                      ) : null}
                    </View>
                  </View>
                  <View style={{ marginBottom: 15 }}>
                    <Text>Township</Text>
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
                  </View> */}

                  <View style={{ marginBottom: 15 }}>
                    <Text>Postal Code</Text>
                    <View>
                      <TextInput
                        style={styles.textInput}
                        placeholderTextColor="#888888"
                        placeholder="Postal Code"
                        keyboardType="numeric"
                        maxLength={5}
                        value={this.state.postalCode}
                        onChangeText={(value) => this.setState({ postalCode: value })}
                      />
                      {this.state.showError.postalCode ? (
                        this.state.postalCode == "" ? (
                          <Text style={styles.errorTextStyle}>
                            Postal Code {error.require_error}
                          </Text>
                        ) : this.state.postalCode.length > 200 ? (
                          <Text style={styles.errorTextStyle}>
                            Postal Code {error.maximum_length_200_error}
                          </Text>
                        ) : null
                      ) : null}
                    </View>
                  </View>

                </View>
              </View>
              <View style={{ marginVertical: 15 }}>
                <Button
                  mode="contained"
                  color={"#262c76"}
                  onPress={() => this.submitPressed()}
                >
                  Place Order
                </Button>
              </View>
            </SafeAreaView>
          )}
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    flex: 1,
    marginTop: 10,
  },
  header: {
    backgroundColor: "#262c76",
    // shadowColor: "#262c76",
    // height: 30,
    // top: -15,
    // paddingHorizontal: 0,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Lexend",
    color: "#fff",
    // width: 100,
    textAlign: "center",
  },
  headers: {
    //   height: 60,
    //   justifyContent: "center",
    //   marginRight: -4,
  },
  title: {
    fontFamily: "LexendBold",
    fontSize: 18,
    color: "#707070",
    marginLeft: 10
  },
  fixToText: {
    flexDirection: "row",
    overflow: "hidden",
    padding: 5
  },
  leftText: {
    width: "50%",
    // fontSize: 16,
    fontFamily: "Lexend"
  },
  rightText: {
    width: "50%",
    // fontSize: 16,
    fontFamily: "Lexend",
    textAlign: "right"
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
    // marginTop: 8,
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
});

export default ProductList;
