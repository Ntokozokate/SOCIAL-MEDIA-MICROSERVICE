const Joi = require("joi");

const validateCreatePost = (data) => {
  const schema = Joi.object({
    title: Joi.string().min(3).max(30).required(), // 👈 NO .alphanum() here
    content: Joi.string().min(3).max(3000).required(), // 👈 NO .alphanum() here
    mediaIds: Joi.array().items(Joi.string()).optional(),
  });
  return schema.validate(data, { abortEarly: false });
};
const validateUpdatePost = (data) => {
  const schema = Joi.object({
    title: Joi.string().min(3).max(30).optional(),
    content: Joi.string().min(3).max(3000).optional(),
    mediaIds: Joi.array().items(Joi.string()).optional(),
  }).min(1);
  return schema.validate(data, { abortEarly: false });
};

module.exports = { validateCreatePost, validateUpdatePost };
