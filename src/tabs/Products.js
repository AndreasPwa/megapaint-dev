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
  BackHandler,
  Text,
  TextInput,
  Modal,
  ScrollView,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { Appbar, Avatar, Button, Card, Checkbox } from "react-native-paper";
import { Icon } from "react-native-elements";
import SelectDropdown from "react-native-select-dropdown";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api_url, error } from "../Global";

class ProductList extends React.Component {
  constructor(props) {
    super(props);

    this.navigation = this.props.navigation;
    this.sortListDropdownRef = React.createRef();
    this.categoriesDropdownRef = React.createRef();
    this.subCategoriesDropdownRef = React.createRef();

    this.state = {
      package: [],
      allCategories: [],
      categories: [],
      allSubCategories: [],
      subCategories: [],

      category: "",
      categoryID: "",
      subCategoListEnable: true,
      subCategory: "",
      minprice: "",
      maxprice: "",
      promoProduct: false,
      newProduct: false,
      bestSellerProduct: false,

      refreshing: true,
      page: 1,
      disable: false,
      searchModalVisible: false,
      sortList: [
        'Name Ascending',
        'Name Descending',
        'Price Lowest',
        'Price Highest'
      ],
      sort: false,
      search: false,
      cancel: false,
      searchinput: "",
      searchCount: "",
      sortKey: "name_asc",
      exist: false,
      cartCount: ""
    };
  }

  componentDidMount() {
    this.backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      this.backAction
    );

    this.navigation.addListener("focus", () => {
      const routeIndex = this.navigation.getState().index;
      const params = this.navigation.getState().routes[routeIndex].params;

      AsyncStorage.getItem("cart").then((cartLists) => {
        var cartList = JSON.parse(cartLists);

        cartList ? this.setState({ cartCount: cartList.map(x => x.quantity).reduce((a, b) => a + b, 0) }) : this.setState({ cartCount: "" });
      })

      AsyncStorage.getItem("token").then((value) => {
        const token = JSON.parse(value);
        fetch(api_url + "profile", {
          headers: {
            Authorization: "Bearer " + token,
          },
        })
          .then((response) => response.json())
          .then((json) => {
            this.navigation.navigate("Products", { userName: json.name });
          })
          .catch((error) => {
            console.error(error);
          });
      })
    });

    this.fetchCategories();

    AsyncStorage.getItem("product").then((productLists) => {
      var productList = JSON.parse(productLists);
      if (productList == null) {
        this.fetchProducts();
      } else {
        fetch(api_url + "shop")
          .then((response) => response.json())
          .then((responseJson) => {
            if (responseJson.data[0].id == productList[0].id) {
              AsyncStorage.getItem("productPage").then((pageno) => {
                if (responseJson.total < responseJson.current_page * responseJson.per_page) {
                  this.setState({ disable: true });
                } else {
                  this.setState({ disable: false });
                }

                this.setState({
                  page: JSON.parse(pageno),
                  package: productList,
                  refreshing: false,
                });
              });
            } else {
              this.onRefresh();
            }
          });
      }
    });
  }

  backAction = () => {
    if (this.navigation.isFocused()) {
      this.setState({ exist: true })
      return true;
    }
  };

  fetchCategories() {
    fetch(api_url + "d/categories")
      .then((response) => response.json())
      .then((responseJson) => {
        for (var i = 0; i < responseJson.data.length; i++) {
          this.state.allCategories.push(responseJson.data[i]);
          this.state.categories.push(responseJson.data[i].category_name);
        }
      })
      .catch((error) => {
        console.log("Data fetching failed");
      });
  }

  fetchProducts() {
    var url = api_url + "shop" + "?page=" + this.state.page;
    this.state.sortKey ? url = url + "&sort=" + this.state.sortKey : null;
    this.state.searchinput ? url = url + "&s=" + this.state.searchinput : null;
    this.state.categoryID ? url = url + "&category=" + this.state.categoryID : null;
    this.state.minprice ? url = url + "&min_price=" + this.state.minprice : null;
    this.state.maxprice ? url = url + "&max_price=" + this.state.maxprice : null;
    this.state.promoProduct ? url = url + "&promo=1" : null;
    this.state.newProduct ? url = url + "&new=1" : null;
    this.state.bestSellerProduct ? url = url + "&bestseller=1" : null;
    console.log(url);

    fetch(url).then((response) => response.json())
      .then((responseJson) => {
        if (
          responseJson.meta.total <
          responseJson.meta.current_page * responseJson.meta.per_page
        ) {
          this.setState({ disable: true, refreshing: false });
        } else {
          this.setState({ disable: false });
        }

        this.state.page == 1 ? (this.state.package = []) : null;
        for (var i = 0; i < responseJson.data.length; i++) {
          this.state.package.push(responseJson.data[i]);
          this.setState({ refreshing: false });
        }
        AsyncStorage.setItem("product", JSON.stringify(this.state.package));
      })
      .catch((error) => {
        this.setState({ refreshing: false })
        console.log("Data fetching failed");
      });
  }

  onRefresh = () => {
    this.setState({ refreshing: true, package: [] });
    this.state.page = 1;
    AsyncStorage.setItem("productPage", JSON.stringify(this.state.page));
    this.state.searchinput == "" &&
      this.state.categoryID == "" &&
      this.state.minprice == "" &&
      this.state.maxprice == "" &&
      this.state.promoProduct == false &&
      this.state.newProduct == false &&
      this.state.bestSellerProduct == false
      ? this.fetchProducts()
      : this.productsSearch();
  };

  loadMore() {
    this.setState({ page: this.state.page + 1 }, () => {
      AsyncStorage.setItem("productPage", JSON.stringify(this.state.page));
      this.fetchProducts();
    });
  }

  //change category
  onCategoriesChange(categoName, index) {
    this.state.subCategories = [];
    this.setState({
      category: categoName,
      categoryID: this.state.allCategories[index].id,
    });

    this.state.allSubCategories = this.state.allCategories[index].children;
    for (var i = 0; i < this.state.allCategories[index].children.length; i++) {
      this.state.subCategories.push(this.state.allSubCategories[i].category_name);
    }

    this.subCategoriesDropdownRef.current.reset();
    this.setState({
      subCategoListEnable: false,
      subCategory: "",
    });
  }
  //subCategory change
  onSubCategoriesChange(subCategoName, index) {
    this.setState({
      subCategory: subCategoName,
      categoryID: this.state.allSubCategories[index].id,
    });
  }

  addToCart(item) {
    var addItem = {
      product_id: item.id,
      product_attribute_id: null,
      product_name: item.product_name,
      code: item.code,
      image: item.image,
      price: item.has_attribute ? this.priceRange(item.minPrice, item.maxPrice) : (item.price2 != 0 ? item.price2 : item.price1)
    };

    // AsyncStorage.removeItem("cart");
    AsyncStorage.getItem("cart").then((cartLists) => {
      var cart = [];
      var cartList = JSON.parse(cartLists);

      if (cartList) {
        for (var i = 0; i < cartList.length; i++) {
          cart.push(cartList[i]);
        }
      }

      var result = cart.find(c => c.id == addItem.id);
      if (result) {
        result.quantity = result.quantity + 1;
      } else {
        addItem.quantity = 1;
        cart.push(addItem);
      }

      this.setState({ cartCount: cart.map(x => x.quantity).reduce((a, b) => a + b, 0) });
      AsyncStorage.setItem("cart", JSON.stringify(cart));
    });
  }

  originPriceRange(minPriceOrigin, maxPriceOrigin) {
    return minPriceOrigin === maxPriceOrigin ? minPriceOrigin : minPriceOrigin + '~' + maxPriceOrigin;
  }

  priceRange(minPrice, maxPrice) {
    return minPrice === maxPrice ? minPrice : minPrice + '~' + maxPrice;
  }

  renderListItem = ({ item }) => (
    <View key={item.id}>
      <Card
        style={{ marginVertical: 5, marginHorizontal: 10 }}
        onPress={() =>
          this.navigation.navigate("ProductDetail", {
            productID: item.id,
          })
        }
      >
        <Card.Content style={{ overflow: "hidden" }}>
          {item.is_new ? <Text style={styles.rotatenew}>New</Text> : null}
          {item.promo ?
            <View style={styles.rotatepromo}>
              <Text style={styles.rotatepromo1}></Text>
              <Text style={styles.rotatepromo2}>{item.promo + "% OFF"}</Text>
            </View> : null}
          <View style={styles.fixToText}>
            {item.image ? (
              <View style={styles.leftText}>
                <Image source={{ uri: item.image }} style={styles.logoImg} />
              </View>
            ) : (
              <View style={styles.leftText}>
                <Image
                  source={require("../../assets/mega-paint-logo.png")}
                  style={styles.logoImg}
                />
              </View>
            )}
            <View style={styles.rightText}>
              <Text
                style={styles.titleText}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {item.product_name}
              </Text>

              {item.has_attribute
                ? (
                  <View>
                    {this.originPriceRange(item.minPriceOrigin, item.maxPriceOrigin) != undefined
                      ? <Text style={{ color: "#262c76", fontFamily: "Lexend", textDecorationLine: "line-through" }}>{"Ks. " + this.originPriceRange(item.minPriceOrigin, item.maxPriceOrigin)}</Text>
                      : null
                    }
                    <Text style={{ color: "#262c76", fontFamily: "Lexend" }}>{"Ks. " + this.priceRange(item.minPrice, item.maxPrice)}</Text>
                  </View>
                )
                : (
                  <View>
                    {item.price2 != 0 ? <Text style={{ color: "#262c76", fontFamily: "Lexend", textDecorationLine: "line-through" }}>{"Ks. " + item.price1}</Text> : null}
                    <Text style={{ color: "#262c76", fontFamily: "Lexend" }}>{"Ks. " + (item.price2 != 0 ? item.price2 : item.price1)}</Text>
                  </View>
                )
              }

              {item.has_attribute
                ? (
                  <View style={{ flexDirection: "row", marginTop: 10, alignSelf: "flex-start" }}>
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
                      onPress={() =>
                        this.navigation.navigate("ProductDetail", {
                          productID: item.id,
                        })
                      }
                    >
                      View Detail
                    </Button>
                  </View>
                )
                : (
                  <View style={{ flexDirection: "row", marginTop: 10, alignSelf: "flex-end" }}>
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
                      onPress={() => this.addToCart(item)}
                    >
                      Add to cart
                    </Button>
                  </View>
                )}
            </View>
          </View>
        </Card.Content>
      </Card>
    </View>
  );

  renderFooter() {
    return this.state.refreshing ? (
      <View style={{ margin: 5 }}></View>
    ) : this.state.disable ? (
      <View style={{ margin: 5 }}></View>
    ) : (
      <ActivityIndicator
        color="#262c76"
        size="large"
        style={{ margin: 10 }}
      />
    );
  }

  productsSearchFilter() {
    this.state.page = 1;

    this.state.searchinput == "" &&
      this.state.categoryID == "" &&
      this.state.minprice == "" &&
      this.state.maxprice == "" &&
      this.state.promoProduct == false &&
      this.state.newProduct == false &&
      this.state.bestSellerProduct == false
      ? (this.setState({ refreshing: true, package: [] }),
        this.fetchProducts())
      : this.productsSearch();
  }

  //change sortkey
  onSortChange(sortName, index) {
    this.state.page = 1;

    this.state.sortKey == (sortName == "Name Ascending" ? "name_asc"
      : sortName == "Name Descending" ? "name_desc"
        : sortName == "Price Lowest" ? "price_low"
          : sortName == "Price Highest" ? "price_high" : null) ? this.state.sort = false : this.state.sort = true;

    sortName == "Name Ascending" ? this.state.sortKey = "name_asc" : null;
    sortName == "Name Descending" ? this.state.sortKey = "name_desc" : null;
    sortName == "Price Lowest" ? this.state.sortKey = "price_low" : null;
    sortName == "Price Highest" ? this.state.sortKey = "price_high" : null;

    this.state.sort
      ? (this.setState({ refreshing: true, package: [] }),
        this.fetchProducts())
      : null;
  }

  newsSortFilter(sort) {
    this.state.page = 1;

    this.state.sort
      ? this.productsSearch()
      : this.state.searchinput == "" &&
        this.state.categoryID == "" &&
        this.state.minprice == "" &&
        this.state.maxprice == "" &&
        this.state.promoProduct == false &&
        this.state.newProduct == false &&
        this.state.bestSellerProduct == false
        ? this.fetchProducts()
        : this.productsSearch();
  }

  productsSearch() {
    var url = api_url + "shop" + "?page=" + this.state.page;
    this.state.sortKey ? url = url + "&sort=" + this.state.sortKey : null;
    this.state.searchinput ? url = url + "&s=" + this.state.searchinput : null;
    this.state.categoryID ? url = url + "&category=" + this.state.categoryID : null;
    this.state.minprice ? url = url + "&min_price=" + this.state.minprice : null;
    this.state.maxprice ? url = url + "&max_price=" + this.state.maxprice : null;
    this.state.promoProduct ? url = url + "&promo=1" : null;
    this.state.newProduct ? url = url + "&new=1" : null;
    this.state.bestSellerProduct ? url = url + "&bestseller=1" : null;

    this.setState({ refreshing: true, package: [] });
    this.fetchProducts();

    this.state.searchinput != "" ||
      this.state.categoryID != "" ||
      this.state.minprice != "" ||
      this.state.maxprice != "" ||
      this.state.promoProduct != false ||
      this.state.newProduct != false ||
      this.state.bestSellerProduct != false
      ? (this.state.cancel = true)
      : (this.state.cancel = false);
    this.setState({
      searchModalVisible: false
    });
  }

  clearSearch() {
    this.state.searchinput = "";
    this.state.categoryID = "";
    this.state.category = "";
    this.state.subCategory = "";
    this.state.minprice = "";
    this.state.maxprice = "";
    this.state.promoProduct = false;
    this.state.newProduct = false;
    this.state.bestSellerProduct = false;
    this.setState({
      cancel: false,
      searchModalVisible: false,
    });
    this.productsSearchFilter();
  }

  render() {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View>
          <Appbar style={styles.header}>
            <Appbar.Action icon="menu" color="#fff" onPress={() => this.navigation.openDrawer()} />
            <Appbar.Content
              title="Products"
              titleStyle={styles.headerTitle}
              style={styles.headers}
            />
            <TouchableOpacity onPress={() => this.navigation.navigate("Cart")}>
              <Appbar.Action icon="cart" color="#fff" onPress={() => this.navigation.navigate("Cart")} />
              {this.state.cartCount ? (
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
                    {this.state.cartCount > 99 ? "99+" : this.state.cartCount}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          </Appbar>
          <View style={{ height: 45, backgroundColor: "#262c76", flexDirection: "row", justifyContent: "center" }}>
            <Text onPress={() => this.setState({ searchModalVisible: true })}
              style={{
                width: "45%",
                alignSelf: "center",
                backgroundColor: "#fff",
                borderRadius: 50,
                marginRight: "2%"
              }}>
              <View style={{
                height: 30,
                paddingLeft: 10,
                paddingTop: 4,
                flexDirection: "row"
              }}>
                <Icon name={"search"} size={22} color="#262c76" />
                <Text style={{ fontFamily: "Lexend", paddingLeft: 5 }}>Search</Text>
              </View>
            </Text>
            <SelectDropdown
              defaultValueByIndex={Number(0)}
              data={this.state.sortList}
              ref={this.sortListDropdownRef}
              onSelect={(selectedItem, index) => {
                this.onSortChange(selectedItem, index);
              }}
              defaultButtonText="Sort"
              buttonStyle={{
                backgroundColor: "#fff",
                borderColor: "#aaa",
                alignSelf: "center",
                borderRadius: 50,
                width: "45%",
                height: 30,
              }}
              buttonTextStyle={{
                fontSize: 13,
                fontFamily: "Lexend",
                textAlign: "left",
                paddingBottom: 2,
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
          </View>
        </View>
        <View style={styles.container}>
          {this.state.refreshing ? (
            <View>
              <ActivityIndicator color="#262c76" size="large" />
            </View>
          ) : this.state.package.length == 0 ? (
            <View>
              <Text style={{ color: "#262c76", fontFamily: "LexendBold", fontSize: 30, textAlign: "center" }}>
                Sorry.
              </Text>
              <Text style={{ color: "#d43434", fontFamily: "Lexend", textAlign: "center" }}>
                No Products Available To Display.
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
                onPress={() => this.clearSearch()}
              >
                Refresh
              </Button>
            </View>
          ) : (
            <FlatList
              data={this.state.package}
              renderItem={this.renderListItem}
              keyExtractor={(item, index) => item.id.toString()}
              onEndReachedThreshold={0.1}
              showsVerticalScrollIndicator={false}
              onEndReached={() => this.loadMore()}
              ListFooterComponent={() => this.renderFooter()}
              refreshControl={
                <RefreshControl
                  refreshing={this.state.refreshing}
                  onRefresh={this.onRefresh}
                />
              }
            />
          )}
        </View>

        <Modal
          visible={this.state.searchModalVisible}
          onRequestClose={() => this.setState({ searchModalVisible: false })}
        >
          <View
            style={{
              backgroundColor: "#262c76",
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 20,
                paddingVertical: 15,
                paddingHorizontal: 20,
                fontFamily: "Lexend",
              }}
            >
              Search
            </Text>
            <Text
              style={{ padding: 14 }}
              onPress={() => this.setState({ searchModalVisible: false })}
            >
              <Icon name={"highlight-off"} color={"#fff"} size={25} />
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View
              style={{
                flexDirection: "row",
                width: "90%",
                alignSelf: "center",
                marginVertical: 20,
              }}
            >
              <TextInput
                placeholderTextColor="#888888"
                placeholder="Search"
                style={styles.searchInput}
                value={this.state.searchinput}
                onChangeText={(value) => {
                  this.setState({ searchinput: value });
                }}
              />
              <Text
                style={{
                  position: "absolute",
                  left: 10,
                  marginTop: 8,
                }}
              >
                <Icon name={"search"} size={25} />
              </Text>
              {this.state.searchinput != "" ? (
                <Text
                  style={{
                    position: "absolute",
                    right: 10,
                    marginTop: 8,
                  }}
                  onPress={() => {
                    this.setState({ searchinput: "", cancel: false });
                  }}
                >
                  <Icon name={"close"} size={25} />
                </Text>
              ) : null}
            </View>

            <View style={styles.inputBorder}>
              <View style={{ borderBottomWidth: 1, borderColor: "#ccc" }}>
                <Text style={{ fontFamily: "LexendBold", marginBottom: 5 }}>
                  All Categories
                </Text>
              </View>
              <View style={{ marginTop: 10 }}>
                <Text style={{ fontFamily: "Lexend" }}>
                  Category
                </Text>
                <SelectDropdown
                  defaultValue={this.state.category}
                  data={this.state.categories}
                  ref={this.categoriesDropdownRef}
                  onSelect={(selectedItem, index) => {
                    this.onCategoriesChange(selectedItem, index);
                  }}
                  defaultButtonText="Category"
                  buttonStyle={styles.dropdownBtnStyle}
                  buttonTextStyle={[
                    styles.dropdownBtnTextStyle,
                    {
                      color: this.state.category != "" ? "#262c76" : "#ccc",
                    },
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
              </View>

              <View style={{ marginTop: 10 }}>
                <Text style={{ fontFamily: "Lexend" }}>Sub-Category</Text>
                <SelectDropdown
                  defaultValue={this.state.subCategory}
                  disabled={this.state.subCategoListEnable}
                  data={this.state.subCategories}
                  ref={this.subCategoriesDropdownRef}
                  onSelect={(selectedItem, index) => {
                    this.onSubCategoriesChange(selectedItem, index);
                  }}
                  defaultButtonText="Sub Category"
                  buttonStyle={styles.dropdownBtnStyle}
                  buttonTextStyle={[
                    styles.dropdownBtnTextStyle,
                    {
                      color: this.state.subCategory != "" ? "#262c76" : "#ccc",
                    },
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
              </View>
            </View>

            <View style={styles.inputBorder}>
              <View style={{ borderBottomWidth: 1, borderColor: "#ccc" }}>
                <Text style={{ fontFamily: "LexendBold", marginBottom: 5 }}>
                  Price Filter
                </Text>
              </View>
              <View style={{ marginTop: 10, flexDirection: "row" }}>
                <TextInput
                  placeholderTextColor="#888888"
                  placeholder="min price"
                  keyboardType={"numeric"}
                  maxLength={10}
                  style={styles.typeInput}
                  value={this.state.minprice}
                  onChangeText={(value) => {
                    this.setState({ minprice: value });
                  }}
                />

                <View style={{ width: "10%", justifyContent: "center" }}>
                  <Text style={{ textAlign: "center", fontSize: 30 }}>~</Text>
                </View>

                <TextInput
                  placeholderTextColor="#888888"
                  placeholder="max price"
                  keyboardType={"numeric"}
                  maxLength={10}
                  style={styles.typeInput}
                  value={this.state.maxprice}
                  onChangeText={(value) => {
                    this.setState({ maxprice: value });
                  }}
                />
              </View>
            </View>

            <View style={[styles.inputBorder, { marginBottom: 60 }]}>
              <View style={{ borderBottomWidth: 1, borderColor: "#ccc" }}>
                <Text style={{ fontFamily: "LexendBold", marginBottom: 5 }}>
                  Product Filter
                </Text>
              </View>
              <View style={{ flexDirection: "row" }}>
                <Checkbox
                  status={this.state.promoProduct ? "checked" : "unchecked"}
                  color="#262c76"
                  onPress={() => {
                    this.setState({ promoProduct: !this.state.promoProduct });
                  }}
                />
                <Text
                  style={{
                    marginTop: 8,
                    color: "#000",
                    fontFamily: "Lexend",
                  }}
                >
                  Promotion Product
                </Text>
              </View>
              <View style={{ flexDirection: "row" }}>
                <Checkbox
                  status={this.state.newProduct ? "checked" : "unchecked"}
                  color="#262c76"
                  onPress={() => {
                    this.setState({ newProduct: !this.state.newProduct });
                  }}
                />
                <Text
                  style={{
                    marginTop: 8,
                    color: "#000",
                    fontFamily: "Lexend",
                  }}
                >
                  New Product
                </Text>
              </View>
              <View style={{ flexDirection: "row" }}>
                <Checkbox
                  status={this.state.bestSellerProduct ? "checked" : "unchecked"}
                  color="#262c76"
                  onPress={() => {
                    this.setState({ bestSellerProduct: !this.state.bestSellerProduct });
                  }}
                />
                <Text
                  style={{
                    marginTop: 8,
                    color: "#000",
                    fontFamily: "Lexend",
                  }}
                >
                  Best Seller Product
                </Text>
              </View>
            </View>
          </ScrollView>

          <View
            style={{
              position: "absolute",
              bottom: 0,
              flexDirection: "row",
              justifyContent: "center",
              backgroundColor: "#f2f2f2"
            }}
          >
            <Button
              mode="contained"
              color={"#262c76"}
              disabled={!this.state.cancel}
              style={{ borderRadius: 0, borderColor: "white", borderRightWidth: 0.5, width: "50%" }}
              onPress={() => this.clearSearch()}
            >
              <Text style={{ fontFamily: "Lexend" }}>{"Clear"}</Text>
            </Button>
            <Button
              mode="contained"
              color={
                this.state.searchinput == "" &&
                  this.state.categoryID == "" &&
                  this.state.minprice == "" &&
                  this.state.maxprice == "" &&
                  this.state.promoProduct == false &&
                  this.state.newProduct == false &&
                  this.state.bestSellerProduct == false
                  ? "#a8aac8"
                  : "#262c76"
              }
              style={{
                borderRadius: 0,
                width: "50%",
              }}
              onPress={() => {
                this.state.search = true;
                this.productsSearchFilter();
              }}
            >
              <Text style={{ fontFamily: "Lexend" }}>{"Search"}</Text>
            </Button>
          </View>
        </Modal>

        <Modal visible={this.state.exist} transparent={true}>
          <View style={{ flex: 1, justifyContent: "center", backgroundColor: "rgba(1,1,1,0.3)" }}>
            <View style={{ backgroundColor: "white", margin: 30, borderRadius: 5 }}>
              <View style={{ paddingHorizontal: 20, paddingVertical: 15 }}>
                <Text style={{ fontSize: 18, fontFamily: "LexendBold" }}>Exit App</Text>
                <Text style={{ fontSize: 16, fontFamily: "Lexend", paddingBottom: 20 }}>Do you want to exit the app?</Text>
                <View style={{ flexDirection: "row", alignSelf: "flex-end" }}>
                  <Text onPress={() => this.setState({ exist: false })} style={{ fontFamily: "Lexend", color: "#262c76", paddingRight: 40 }}>Cancel</Text>
                  <Text onPress={() => BackHandler.exitApp(this.setState({ exist: false }))} style={{ fontFamily: "Lexend", color: "#262c76", paddingRight: 10 }}>OK</Text>
                </View>
              </View>
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
    shadowColor: "#262c76",
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
  },
  rightText: {
    width: "70%",
  },
  titleText: {
    fontSize: 16,
    marginTop: 8,
    fontFamily: "Lexend",
  },

  detailText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 22,
    fontFamily: "Lexend",
  },
  calendar: {
    backgroundColor: "transparent",
    paddingRight: 10,
    paddingBottom: 8,
  },

  rotatenew: {
    backgroundColor: "#e60012",
    transform: [{ rotate: "-45deg" }],
    color: "#fff",
    fontSize: 11,
    paddingTop: 3,
    top: 8,
    width: 160,
    height: 24,
    textAlign: "center",
    left: -60,
    position: "absolute",
    zIndex: 1
  },
  rotatepromo: {
    height: 26,
    right: 0,
    position: "absolute",
    flexDirection: "row",
    zIndex: 1
  },
  rotatepromo1: {
    width: 0,
    height: 0,
    borderTopWidth: 13,
    borderBottomWidth: 13,
    borderRightWidth: 13,
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: "#269956",
  },
  rotatepromo2: {
    backgroundColor: "#269956",
    color: "#fff",
    fontSize: 12,
    fontFamily: "Lexend",
    textAlign: "center",
    paddingTop: 5,
    paddingRight: 5,
  },

  searchInput: {
    width: "100%",
    backgroundColor: "white",
    paddingLeft: 40,
    paddingRight: 40,
    height: 40,
    color: "#262c76",
    borderColor: "#aaa",
    borderWidth: 1,
    borderRadius: 20,
    fontFamily: "Lexend",
  },


  border: {
    position: "absolute",
    right: 0,
    borderColor: "#ccc",
    borderWidth: 0.5,
    fontSize: 12,
    fontFamily: "Lexend",
    color: "grey",
    padding: 2,
  },
  searchBorder: {
    flexDirection: "row",
    width: "90%",
    alignSelf: "center",
    marginVertical: 20,
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#fff",
    borderColor: "#aaa",
    borderWidth: 1,
    borderRadius: 30,
    shadowColor: "#000",
    elevation: 3,
  },
  inputBorder: {
    width: "90%",
    alignSelf: "center",
    marginVertical: 20,
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 5,
    padding: 10,
    shadowColor: "transparent",
    shadowOpacity: 10,
  },
  typeInput: {
    width: "45%",
    backgroundColor: "white",
    paddingHorizontal: 10,
    paddingBottom: 2,
    height: 40,
    color: "#262c76",
    borderColor: "#aaa",
    borderWidth: 1,
    borderRadius: 5,
    fontFamily: "Lexend",
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
    fontFamily: "Lexend",
  },
  dropdownDropdownStyle: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
  },
});

export default ProductList;
