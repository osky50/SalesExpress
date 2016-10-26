var customerModel = function () {
    return kendo.data.Model.define({
        fields: {
            Cust_Id: {
                type: "string", // the field is a string
                from: "[\"Cust-Id\"]",
            },
            FormattedAddress: {
                type: "string", // the field is a string
            },
        }
    })
};

var locationModel = function () {
    return kendo.data.Model.define({
        id: "id", // the identifier is the "id" field (declared below)
        fields: {
            Loc_Id: {
                type: "string", // the field is a string
                validation: { // validation rules
                    required: true // the field is required
                },
                from: "[\"Loc-id\"]",
                defaultValue: "<empty>" // default field value

            },
            Loc_Id1: {
                type: "string", // the field is a string
                validation: { // validation rules
                    required: true // the field is required
                },
                from: "[\"Loc-Id\"]",
                defaultValue: "<empty>" // default field value

            }
        }
    })
};

var productModel = function () {
    return kendo.data.Model.define({
        id: "id", // the identifier is the "id" field (declared below)
        fields: {
            Prod_Id: {
                type: "string", // the field is a string
                validation: { // validation rules
                    required: true // the field is required
                },
                from: "[\"Product-Id\"]",
                defaultValue: "<empty>" // default field value

            },
            Prod_Recno: {
                type: "string", // the field is a string
                validation: { // validation rules
                    required: true // the field is required
                },
                from: "[\"Prod-RecNo\"]",
                defaultValue: "<empty>" // default field value

            }
        }
    })
};


var EOrderClass = function () {
    this.eOrder = {
        "CustId": null,
        "eOrderLine": []
    }

    this.setCustId = function (custid) {
        this.eOrder.CustId = custid
    }
    this.addLine = function (lineno, locid, prodrecno, orderqty, checksum, rowid) {
        var eOrderLine = {};
        if (arguments.length == 0) return;
        // allow signature overloading for the method
        if (typeof lineno === "object") {
            //lineno is actually an object use it as is
            eOrderLine = lineno;
        }
        else {
            eOrderLine.LocId = locid || "";
            eOrderLine.ProdRecno = prodrecno || "";
            eOrderLine.OrderQty = orderqty || 0;
            eOrderLine.LineNo = lineno || 0;
            eOrderLine.CheckSum = checksum || "";
            eOrderLine.Rowid = rowid || "";
        }
        this.eOrder.eOrderLine.push(eOrderLine);
    }
    this.getEOrder = function () {
        return this.eOrder;
    }

};

var addLineToShoppingCart = function (eOrder, callBackFn) {
    jsdoSettings.resourceName = 'dsOrder';
    jsdoSettings.tableName = 'eOrder';
    var updatejsdoModel = new progress.data.JSDO({
        name: jsdoSettings.resourceName,
        autoFill: false,
    });
    var updateLineData = {
        "dsOrder": {
            "eOrder": [eOrder]
        }
    };
    var promise = updatejsdoModel.invoke('AddOrderLine', updateLineData);
    promise.done(function (session, result, details) {
        if (details.success == true) {
            var errors = false;
            try {
                errors = app.getErrors(details.response.dsOrder.dsOrder.restResult);
            } catch (e) {
                console.log("Error", e)
            }
            if (errors)
                return;
            // Executing call back as everything finshed successfully
            callBackFn.apply(callBackFn);
        }
    });
    promise.fail(function () {
        app.showError('Failed to update the shopping cart');
    });
};
