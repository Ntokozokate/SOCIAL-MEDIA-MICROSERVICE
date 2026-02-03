const Joi = require("joi");

const validateRegistration = (data) => {
  const schema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string()
      .email({ minDomainSegments: 2, tlds: { allow: ["com", "net", "org"] } })
      .required(),
    password: Joi.string().min(8).max(30).required(),
  });
  return schema.validate(data, { abortEarly: false });
};
module.exports = { validateRegistration };
