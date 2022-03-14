import React from "react";

// export const api_url = "http://192.168.1.3:93/api/"; //home network
export const api_url = "http://172.16.40.34:93/api/"; //office network

export const error = {
  //error Message
  require_error: "field is required.",
  pattern_error: "is invalid.",
  at_least_8_or_most_20_error:
    "must be 8 to 20 characters.",
  maximum_length_100_error: "must not exceed 100 characters.",
  maximum_length_200_error: "must not exceed 200 characters.",
  password_do_not_match_error: "do not match with password.",
};
