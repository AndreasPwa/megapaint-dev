import React, { useState, useEffect, useRef } from "react";
import { Appbar, List, Avatar, Button, Portal, Provider } from "react-native-paper";
import {
  StyleSheet,
  Text,
  View,
  Image,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  BackHandler,
  TouchableOpacity
} from "react-native";
import { Icon } from "react-native-elements";
import SelectDropdown from "react-native-select-dropdown";
import { ImageSlider } from "react-native-image-slider-banner";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { convertEng2Mm, api_url } from "../Global";

export default function NewDetail({ route, navigation }) {
  const productID = route.params.productID;

  const attriListDropdownRef = useRef({});
  const [data, setData] = useState({});
  const [attributes, setAttributes] = useState({});
  const [chooseAttri, SetChooseAttri] = useState({});
  const [quantityCount, SetQuantityCount] = useState(1);

  // const [images, setImages] = useState([]);
  const [cartCount, SetCartCount] = useState("");
  const [isLoading, setLoading] = useState(true);

  const images = [
    // { img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5a5uCP-n4teeW2SApcIqUrcQApev8ZVCJkA&usqp=CAU' },
    { img: 'http://172.16.40.34:93/images/uploads/products_img/FR8oN0cmaGBM/u3j5qyfo.jpg' },
    // { img: 'https://cdn.pixabay.com/photo/2015/04/19/08/32/marguerite-729510__340.jpg' }
  ]

  useEffect(() => {
    navigation.addListener("focus", () => {
      const routeIndex = navigation.getState().index;
      const productID = navigation.getState().routes[routeIndex].params.productID;

      fetchProductDetail(productID);

      AsyncStorage.getItem("cart").then((cartLists) => {
        var cartList = JSON.parse(cartLists);

        cartList ? SetCartCount(cartList.map(x => x.quantity).reduce((a, b) => a + b, 0)) : SetCartCount("");
      })

      const backAction = () => {
        if (navigation.isFocused()) {
          navigation.goBack(setLoading(true), SetQuantityCount(1));
          return true;
        }
      };
      BackHandler.addEventListener("hardwareBackPress", backAction);
      return () =>
        BackHandler.removeEventListener("hardwareBackPress", backAction);
    });
  }, [navigation]);

  function fetchProductDetail(productID) {
    setLoading(true);
    fetch(api_url + "product/" + productID)
      .then((response) => response.json())
      .then((responseJson) => {
        setData(responseJson.product);

        responseJson.attributes.length != 0
          ? (setAttributes(responseJson.attributes), SetChooseAttri(responseJson.attributes[Object.keys(responseJson.attributes)][0]))
          : (setAttributes({}), SetChooseAttri({}));

        // setImages(responseJson.images);
        setLoading(false);
      })
      .catch((error) => {
        console.log("Data fetching failed");
      });
  }

  function priceRange(minPrice, maxPrice) {
    return minPrice === maxPrice ? minPrice : minPrice + '~' + maxPrice;
  }

  function onAtrributeChange(item, index, attriKey) {
    SetChooseAttri(attributes[attriKey][index]);
  }

  function addToCart(item) {
    var addItem = {
      product_id: item.id,
      product_attribute_id: null,
      product_name: item.product_name,
      code: item.code,
      image: item.image,
      price: item.price2 != 0 ? item.price2 : item.price1,
    };

    item.has_attribute
      ? (addItem.price = chooseAttri.price2 ? chooseAttri.price2 : chooseAttri.price1,
        addItem.display_name = chooseAttri.display_name,
        addItem.product_attribute_code = chooseAttri.product_attribute_code,
        addItem.product_attribute_id = chooseAttri.product_attribute_id)
      : null;

    AsyncStorage.getItem("cart").then((cartLists) => {
      var cart = [];
      var cartList = JSON.parse(cartLists);

      if (cartList) {
        for (var i = 0; i < cartList.length; i++) {
          cart.push(cartList[i]);
        }
      }

      var result = cart.find(c => c.product_attribute_id == addItem.product_attribute_id);
      if (result) {
        result.quantity = result.quantity + quantityCount;
      } else {
        addItem.quantity = quantityCount;
        cart.push(addItem);
      }

      SetCartCount(cart.map(x => x.quantity).reduce((a, b) => a + b, 0));
      AsyncStorage.setItem("cart", JSON.stringify(cart));
    });
  }

  const Detail = () => {
    return (
      <View>

        <ImageSlider
          data={images}
          autoPlay={true}
          // caroselImageContainerStyle={{ height: 300 }}
          // caroselImageStyle={{ height: 250 }}
          previewImageContainerStyle={{ backgroundColor: "#f2f2f2" }}
          // onItemChanged={(item) => console.log("item", item)}
          closeIconColor="#262c76"
          activeIndicatorStyle={{ backgroundColor: "#262c76" }}
        // inActiveIndicatorStyle={{ backgroundColor: "red" }}
        />

        <Text
          style={{
            fontSize: 20,
            fontFamily: "Lexend",
            lineHeight: 35,
            color: "#262c76",
            marginTop: 10,
          }}
        >
          {data.product_name}
          {chooseAttri.display_name ? " (" + chooseAttri.display_name + ")" : null}
        </Text>

        <View>
          <Text style={{ fontFamily: "Lexend" }}>{"(ID: " + data.code + ")"}</Text>
        </View>


        <View style={{ marginVertical: 10 }}>
          {data.has_attribute
            ?
            <Text style={{ color: "#262c76", fontFamily: "Lexend" }}>{"Ks. " + (chooseAttri.price2 ? chooseAttri.price2 : chooseAttri.price1)}</Text>
            :
            <Text style={{ color: "#262c76", fontFamily: "Lexend" }}>{"Ks. " + (data.price2 != 0 ? data.price2 : data.price1)}</Text>
          }
        </View>


        {attributes ?
          (Object.keys(attributes).map((attriKey) =>
            <View key={attriKey} style={{ marginBottom: 10, flexDirection: "row" }}>
              <Text style={{ alignSelf: "center", fontFamily: "Lexend", width: "20%" }}>{attriKey + ": "}</Text>
              <SelectDropdown
                defaultValue={chooseAttri.display_name}
                data={attributes[attriKey].map((attriValue) => attriValue.display_name)}
                // ref={attriListDropdownRef}
                onSelect={(selectedItem, index) => {
                  onAtrributeChange(selectedItem, index, attriKey);
                }}
                buttonStyle={{
                  borderWidth: 1,
                  borderColor: "#aaa",
                  alignSelf: "center",
                  borderRadius: 5,
                  width: "40%",
                  height: 30,
                }}
                buttonTextStyle={{
                  fontSize: 14,
                  fontFamily: "Lexend",
                  textAlign: "left",
                }}
                dropdownIconPosition="right"
                rowTextStyle={styles.dropdownRowTextStyle}
                renderDropdownIcon={() => {
                  return (
                    <Icon name={"arrow-drop-down"} size={25} color="#aaa" />
                  );
                }}
                dropdownStyle={styles.dropdownDropdownStyle}
              />
            </View>)) : null}

        <View>
          <Text style={{ fontFamily: "Lexend" }}>{"A Beautiful home is not only about walls and furniture, but its also expressed through finer details in your home. Check out Majestic Supreme Finish, our new water based paint for wood and trims."}</Text>
        </View>

        <View style={{ flexDirection: "row", marginTop: 10, justifyContent: "space-between" }}>

          <View style={{ flexDirection: "row" }}>
            <TouchableOpacity onPress={() => SetQuantityCount(quantityCount - 1)} disabled={quantityCount < 2}>
              <Image
                style={{ height: 30, width: 30 }}
                source={require("../../assets/photos/minus.png")}
              />
            </TouchableOpacity>
            <Text style={{ alignSelf: "center", paddingHorizontal: 15, fontSize: 18, color: "#262c76", fontFamily: "Lexend" }}>{quantityCount}</Text>
            <TouchableOpacity onPress={() => SetQuantityCount(quantityCount + 1)}>
              <Image
                style={{ height: 30, width: 30 }}
                source={require("../../assets/photos/plus.png")}
              />
            </TouchableOpacity>
          </View>

          <Button
            mode="contained"
            color={"#262c76"}
            style={{
              height: 30,
            }}
            labelStyle={{
              color: "#fff",
              fontFamily: "Lexend",
              fontSize: 12,
              top: -2,
              height: 30
            }}
            onPress={() => addToCart(data)}
          >
            Add to cart
          </Button>
        </View>

        <View style={{ marginTop: 20 }}>
          {/* <List.Item
            title="Suppliers"
            onPress={() => navigation.navigate("Suppliers")}
            right={(props) => <List.Icon icon="chevron-right" />}
            titleStyle={styles.listText}
            style={[styles.listItem, { backgroundColor: "#e9e9f1" }]}
          /> */}
          <List.Item
            title="Brands"
            onPress={() => navigation.navigate("Brands")}
            right={(props) => <List.Icon icon="chevron-right" />}
            titleStyle={styles.listText}
            style={[styles.listItem, { backgroundColor: "#e9e9f1" }]}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Appbar style={styles.topBar}>
        <Appbar.Action
          icon="arrow-left"
          onPress={() => {
            navigation.goBack();
            setLoading(true);
            SetQuantityCount(1);
          }}
        />
        <Appbar.Content
          title={"Product Detail"}
          titleStyle={styles.headerTitle}
          style={styles.headers}
        />
        <TouchableOpacity onPress={() => navigation.navigate("Cart")}>
          <Appbar.Action icon="cart" color="#fff" onPress={() => navigation.navigate("Cart")} />
          {cartCount ? (
            <View style={{
              position: "absolute",
              backgroundColor: "red",
              borderRadius: 50,
              top: 5,
              right: 5,
              minWidth: 16,
              minHeight: 16,
            }}>
              <Text
                style={{
                  fontFamily: "Lexend",
                  paddingBottom: 2,
                  fontSize: 11,
                  color: "#fff",
                  textAlign: "center",
                  paddingHorizontal: 2
                }}
              >
                {cartCount > 99 ? "99+" : cartCount}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </Appbar>

      {isLoading ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.container}>
            {productID != data.id ? (
              <SafeAreaView
                style={[
                  styles.container,
                  { height: Dimensions.get("window").height },
                ]}
              >
                <ActivityIndicator color="#262c76" size="large" />
              </SafeAreaView>
            ) : (
              <SafeAreaView>
                <Detail />
              </SafeAreaView>
            )}
          </View>
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.container}>
            <Detail />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    margin: 10,
  },
  topBar: {
    backgroundColor: "#262c76",
    shadowColor: "#262c76",
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Lexend",
    color: "#fff",
    textAlign: "center",
    padding: 0,
  },
  headers: {
    // height: 100,
    // justifyContent: "center",
    // backgroundColor: "yellow",
  },
  fixToText: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  border: {
    borderColor: "#D8D8D8",
    borderWidth: 1,
    color: "grey",
    padding: 15,
    marginTop: 15,
  },

  listText: {
    fontSize: 16,
    fontFamily: "Lexend",
  },
  listItem: {
    paddingHorizontal: 20,
    paddingVertical: 0,
    borderBottomColor: "#f2f2f2",
    borderBottomWidth: 3
  },
});
