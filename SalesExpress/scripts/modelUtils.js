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

var eLoc = kendo.data.Model.define({
    id: "id", // the identifier is the "id" field (declared below)
    fields: {
        Loc_Id: {
            type: "string", // the field is a string
            validation: { // validation rules
                required: true // the field is required
            },
            from: "[\"Loc-id\"]",
            defaultValue: "<empty>" // default field value

        }
    }
});