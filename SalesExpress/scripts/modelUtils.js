var eCustomer = kendo.data.Model.define({
    fields: {
        Cust_Id: {
            type: "string", // the field is a string
            from: "[\"Cust-Id\"]",
        },
        FormattedAddress: {
            type: "string", // the field is a string
        },
    }
});