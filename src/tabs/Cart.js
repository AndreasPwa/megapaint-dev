import React from "react";
import {
  View,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  Dimensions,
  Text,
  TextInput,
  Modal,
  Pressable,
  TouchableOpacity,
  BackHandler
} from "react-native";
import { Appbar, Avatar, Button, IconButton, Card, List } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { api_url, error } from "../Global";

class CartList extends React.Component {
  constructor(props) {
    super(props);

    this.navigation = this.props.navigation;
    this.row = [];
    this.prevOpenedRow = "";

    this.state = {
      package: [],
      updatepackage: [],
      taxRate: "",
      tax: "",
      subTotal: "",
      tokenValid: false,
      saveCart: false,
      refreshing: true,
      loading: false,
    };
  }

  componentDidMount() {
    BackHandler.addEventListener(
      "hardwareBackPress",
      this.backAction
    );

    this.navigation.addListener("focus", () => {
      this.setState({ package: [], refreshing: true });
      AsyncStorage.getItem("token").then((value) => {
        const token = JSON.parse(value);
        this.fetchTax();
        this.checkToken(token);
        this.checkSaveCart(token);
        this.fetchCarts();
      })
    });
  }

  backAction = () => {
    if (this.navigation.isFocused()) {
      this.state.tokenValid
        ? this.navigation.navigate("Products")
        : this.navigation.goBack();
      return true;
    }
  };

  fetchTax() {
    fetch(api_url + "d/tax/rate")
      .then((response) => response.json())
      .then((json) => {
        this.setState({ taxRate: json });
      })
      .catch((error) => {
        console.log("Data fetching failed");
      });
  }

  checkToken(token) {
    fetch(api_url + "token-check", {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
    })
      .then((response) => response.json())
      .then((json) => {
        json.status
          ? this.setState({ tokenValid: true })
          : this.setState({ tokenValid: false });
      })
      .catch((error) => {
        console.error(error);
      });
  }

  checkSaveCart(token) {
    fetch(api_url + "cart/saved/get", {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
    })
      .then((response) => response.json())
      .then((json) => {
        json.data
          ? this.setState({ saveCart: true })
          : this.setState({ saveCart: false });
      })
      .catch((error) => {
        console.error(error);
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

  save() {
    AsyncStorage.getItem("token").then((value) => {
      const token = JSON.parse(value);

      this.state.saveCart
        ? Alert.alert("", "One saved cart already existed.", [
          {
            text: "Merge",
            onPress: async () => { this.mergeCart(token) },
          },
          {
            text: "Replace",
            onPress: async () => { this.replaceCart(token) },
          },
        ])
        : this.saveCartLists(token);
    })
  }

  saveCartLists() {
    this.setState({ loading: true });
    AsyncStorage.getItem("token").then((value) => {
      const token = JSON.parse(value);

      fetch(api_url + "cart/save", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(this.state.package),
      })
        .then((response) => response.json())
        .then((json) => {
          json.status == "success"
            ? (AsyncStorage.removeItem("cart"), this.navigation.navigate("SaveCart"))
            : Alert.alert("", "Failed to save cart.", [
              {
                text: "OK",
              }
            ]);
          this.setState({ loading: false });
        })
        .catch((error) => {
          console.error(error);
        });
    });
  }

  mergeCart(token) {
    this.setState({ loading: true });
    fetch(api_url + "cart/save/merge", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(this.state.package),
    })
      .then((response) => response.json())
      .then((json) => {
        json.status == "success"
          ? (AsyncStorage.removeItem("cart"), this.navigation.navigate("SaveCart"))
          : Alert.alert("", "Failed to save cart.", [
            {
              text: "OK",
            }
          ]);

        this.setState({ loading: false });
      })
      .catch((error) => {
        console.error(error);
      });
  }

  replaceCart(token) {
    this.setState({ loading: true });
    fetch(api_url + "cart/save/replace", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(this.state.package),
    })
      .then((response) => response.json())
      .then((json) => {
        json.status == "success"
          ? (AsyncStorage.removeItem("cart"), this.navigation.navigate("SaveCart"))
          : Alert.alert("", "Failed to save cart.", [
            {
              text: "OK",
            }
          ]);

        this.setState({ loading: false });
      })
      .catch((error) => {
        console.error(error);
        this.setState({ refreshing: false });
      });
  }

  checkOut() {
    this.state.tokenValid
      ? Alert.alert("", "Call Api", [
        {
          text: "OK",
          style: "cancel",
        }
      ])
      : Alert.alert("", "Please login first for check-out.", [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Login",
          onPress: async () => {
            this.navigation.navigate("Login", {
              previousScreen: "Cart",
            })
          },
        },
      ]);
    // setisLoading(true);
    // AsyncStorage.getItem("token").then((value) => {
    //   const token = JSON.parse(value);

    //   fetch(api_url + "cart/save", {
    //     method: "POST",
    //     headers: {
    //       Accept: "application/json",
    //       "Content-Type": "application/json",
    //       Authorization: "Bearer " + token,
    //     },
    //     body: JSON.stringify(this.state.package),
    //   })
    //     .then((response) => response.json())
    //     .then((json) => {
    //       console.log(json);

    //       // setisLoading(false);
    //     })
    //     .catch((error) => {
    //       console.error(error);
    //     });
    // });
  }

  decreaseQuantity(i, quantity) {
    quantity < 2
      ? this.removeItem(i)
      : this.state.package[i].quantity = quantity - 1;
    this.setState({ updatepackage: this.state.package });
    AsyncStorage.setItem("cart", JSON.stringify(this.state.package));
    this.fetchCarts();
  }

  increaseQuantity(i, quantity) {
    this.state.package[i].quantity = quantity + 1;
    this.setState({ updatepackage: this.state.package });
    AsyncStorage.setItem("cart", JSON.stringify(this.state.package));
    this.fetchCarts();
  }

  removeItem(i) {
    this.state.package = this.state.package.slice(0, i).concat(this.state.package.slice(i + 1, this.state.package.length));
  }

  deleteItem(i) {
    this.state.package = this.state.package.slice(0, i).concat(this.state.package.slice(i + 1, this.state.package.length));
    this.setState({ updatepackage: this.state.package });
    AsyncStorage.setItem("cart", JSON.stringify(this.state.package));
    this.fetchCarts();
  };

  originPriceRange(minPriceOrigin, maxPriceOrigin) {
    return minPriceOrigin === maxPriceOrigin ? minPriceOrigin : minPriceOrigin + '~' + maxPriceOrigin;
  }

  priceRange(minPrice, maxPrice) {
    return minPrice === maxPrice ? minPrice : minPrice + '~' + maxPrice;
  }

  closeRow(index) {
    if (this.prevOpenedRow && this.prevOpenedRow !== this.row[index]) {
      this.prevOpenedRow.close();
    }
    this.prevOpenedRow = this.row[index];
  };

  renderRightActions = (progress, dragX, index) => {
    return (
      <View
        style={{
          marginVertical: 5,
          marginRight: 5,
          justifyContent: 'center',
        }}>
        <IconButton
          icon="delete"
          color="#fff"
          size={35}
          style={{
            height: "100%",
            width: 70,
            backgroundColor: "red",
            borderRadius: 5
          }}
          onPress={() => this.deleteItem(index)}
        />
      </View>
    );
  };

  renderListItem = ({ item, index }) => (
    <Swipeable
      renderRightActions={(progress, dragX) =>
        this.renderRightActions(progress, dragX, index)
      }
      onSwipeableOpen={() => this.closeRow(index)}
      ref={(ref) => this.row[index] = ref}
      rightOpenValue={-100}>
      <View key={index}>
        <Card style={{ marginVertical: 5, marginHorizontal: 10 }}      >
          <Card.Content style={{ overflow: "hidden" }}>
            <View style={styles.fixToText}>
              {item.image ? (
                <View style={styles.leftText}>
                  <TouchableOpacity
                    onPress={() =>
                      this.navigation.navigate("ProductDetail", {
                        productID: item.product_id,
                      })
                    }>
                    <Image source={{ uri: item.image }} style={styles.logoImg} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.leftText}>
                  <TouchableOpacity
                    onPress={() =>
                      this.navigation.navigate("ProductDetail", {
                        productID: item.product_id,
                      })
                    }>
                    <Image source={require("../../assets/mega-paint-logo.png")} style={styles.logoImg} />
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.rightText}>
                <Text
                  style={styles.titleText}
                // numberOfLines={2}
                // ellipsizeMode="middle"
                >
                  {item.product_name}{item.display_name ? " (" + item.display_name + ")" : null}
                </Text>

                <View style={{ marginVertical: 10 }}>
                  <Text style={{ color: "#262c76", fontFamily: "Lexend", fontSize: 16 }}>{"Ks. " + item.price}</Text>
                </View>

                <View style={{ flexDirection: "row" }}>
                  <Text style={{ alignSelf: "center", paddingRight: 5, fontSize: 18, fontFamily: "Lexend" }}>{"Quantity: "}</Text>
                  <TouchableOpacity onPress={() => this.decreaseQuantity(index, item.quantity)}>
                    <Image
                      style={{ height: 25, width: 25 }}
                      source={require("../../assets/photos/minus.png")}
                    />
                  </TouchableOpacity>
                  <Text style={{ alignSelf: "center", paddingHorizontal: 15, fontSize: 18, color: "#262c76", fontFamily: "Lexend" }}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => this.increaseQuantity(index, item.quantity)}>
                    <Image
                      style={{ height: 25, width: 25 }}
                      source={require("../../assets/photos/plus.png")}
                    />
                  </TouchableOpacity>
                </View>

              </View>
            </View>
          </Card.Content>
        </Card>
      </View>
    </Swipeable>
  );

  render() {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View>
          <Appbar style={styles.header}>
            <Appbar.Action
              icon="arrow-left"
              onPress={() => {
                this.state.tokenValid
                  ? this.navigation.navigate("Products")
                  : this.navigation.goBack();
              }}
            />
            <Appbar.Content
              title="Cart"
              titleStyle={styles.headerTitle}
              style={styles.headers}
            />
            <Appbar.Action />
          </Appbar>
        </View>
        <View style={styles.container}>
          {this.state.refreshing ? (
            <View>
              <ActivityIndicator color="#262c76" size="large" />
            </View>
          ) : this.state.package == null || this.state.package.length == 0 ? (
            <View>
              <Image
                source={require("../../assets/photos/clearcart-icon.png")}
                style={{ alignSelf: "center" }}
              />
              <Text style={{ color: "#d43434", textAlign: "center", fontFamily: "Lexend" }}>
                There is no product in the cart.
              </Text>
              <Button
                mode="contained"
                color={"#262c76"}
                style={{
                  marginTop: 10,
                  width: 140,
                  alignSelf: "center"
                }}
                labelStyle={{
                  color: "#fff",
                  fontFamily: "Lexend",
                }}
                onPress={() => this.navigation.navigate("Products")}
              >
                Go To Shop
              </Button>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <FlatList
                data={this.state.package}
                extraData={this.state.updatepackage}
                renderItem={this.renderListItem}
                keyExtractor={(item, index) => index.toString()}
                showsVerticalScrollIndicator={false}
              />
              <View style={styles.checkoutView}>
                <View style={styles.fixToText}>
                  <Text style={styles.leftText}>{"Sub-Total:  "}</Text>
                  <Text style={styles.rightText}>{this.state.subTotal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}{" Ks"}</Text>
                </View>
                <View style={styles.fixToText}>
                  <Text style={styles.leftText}>{"Taxes:  "}</Text>
                  <Text style={styles.rightText}>{this.state.tax.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}{" Ks"}</Text>
                </View>
                <View style={styles.fixToText}>
                  <Text style={styles.leftText}>{"Total:  "}</Text>
                  <Text style={styles.rightText}>{(this.state.subTotal + this.state.tax).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}{" Ks"}</Text>
                </View>
                <View style={{ flexDirection: "row", marginTop: 10, justifyContent: "space-between" }}>
                  {this.state.tokenValid ?
                    <Button
                      mode="contained"
                      color={"#262c76"}
                      style={{
                        height: 30
                      }}
                      labelStyle={{
                        color: "#fff",
                        fontFamily: "Lexend",
                        fontSize: 12,
                        top: -2,
                        height: 30
                      }}
                      onPress={() => this.save()}
                    >
                      Save
                    </Button> : <Button />}
                  <Button
                    mode="contained"
                    color={"#262c76"}
                    style={{
                      height: 30
                    }}
                    labelStyle={{
                      color: "#fff",
                      fontFamily: "Lexend",
                      fontSize: 12,
                      top: -2,
                      height: 30
                    }}
                    onPress={() => this.checkOut()}
                  >
                    Check Out
                  </Button>
                </View>
              </View>
            </View>
          )}
        </View>

        <Modal visible={this.state.loading} transparent={true}>
          <View style={{ flex: 1, justifyContent: "center", backgroundColor: "rgba(1,1,1,0.3)" }}          >
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
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    flex: 1,
    marginTop: 10,
  },
  header: {
    backgroundColor: "#262c76",
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Lexend",
    color: "#fff",
    textAlign: "center",
  },
  headers: {
    //   height: 60,
    //   justifyContent: "center",
    //   marginRight: -4,
  },

  logoImg: {
    width: 80,
    height: 80,
  },
  fixToText: {
    flexDirection: "row",
    overflow: "hidden"
  },
  leftText: {
    width: "30%",
    fontSize: 16,
    fontFamily: "Lexend"
  },
  rightText: {
    width: "70%",
    fontSize: 16,
    fontFamily: "Lexend"
  },
  titleText: {
    fontSize: 16,
    fontFamily: "Lexend",
  },

  checkoutView: {
    alignSelf: "center",
    marginTop: 10,
    padding: 20,
    backgroundColor: "#e9e9f1",
    width: "98%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20
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

export default CartList;
