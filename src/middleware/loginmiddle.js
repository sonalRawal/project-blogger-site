
const jwt = require("jsonwebtoken");

const authenticate = function (req, res, next) {
    try {
        let authToken = req.headers["x-api-key"];
        // console.log(authToken,"token")
        if (!authToken) {
            res.status(401).send({ status: false, message: "Mandatory authentication header missing" });
        } else {
            let decodedToken = jwt.verify(authToken, "radium-secret");

            console.log(decodedToken,"decodedtoken")

            if (decodedToken) {
                   req["authorId"] = decodedToken.authorId
                   
                next();
            } else {
                res.status(401).send({ status: false, message: "The authentication token is invalid" });
            }
        }
    } catch(err) {
        res.status(500).send({ status: false, message: err.message });

    }
};

module.exports.authenticate = authenticate;

