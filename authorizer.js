// this is not tested
module.exports.auth = async (event, context, callback) => {
  const token = event.headers.Authorization || event.headers.authorization;
  if (!token) {
    return callback(null, {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" }),
    });
  }

  try {
    // Decode and verify the token (e.g., using a JWT library)
    // Example: Use jsonwebtoken library to verify JWT
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    callback(null, {
      principalId: decoded.sub,
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Allow",
            Resource: event.methodArn,
          },
        ],
      },
    });
  } catch (error) {
    callback(null, {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" }),
    });
  }
};
