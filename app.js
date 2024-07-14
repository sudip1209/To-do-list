//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
// mongoose.connect("mongodb://localhost:27017/todolistDB", { useNewUrlParser: true,useUnifiedTopology:true });
mongoose.connect(
  "mongodb+srv://sudip:35q4cWVR7ffO6kHD@cluster0.rflvhbl.mongodb.net/todolistDB",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

const itemsSchema = new mongoose.Schema({
  name: String,
});
const Item = mongoose.model("Item", itemsSchema);

const defaultItem = [];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});
const List = mongoose.model("List", listSchema);

app.get("/", async function (req, res) {
  try {
    const items = await Item.find({});
    res.render("list", { listTitle: "Today", newListItems: items });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error fetching items.");
  }
});

app.post("/", async function (req, res) {
  const itemname = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemname,
  });

  try {
    if (listName === "Today") {
      await item.save();
      res.redirect("/");
    } else {
      let foundList = await List.findOne({ name: listName });

      if (!foundList) {
        foundList = new List({
          name: listName,
          items: defaultItems,
        });
      }

      foundList.items.push(item);
      await foundList.save();
      res.redirect("/" + listName);
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error saving item.");
  }
});

app.get("/:customListName", async function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  try {
    const foundList = await List.findOne({ name: customListName }).exec();

    if (!foundList) {
      //console.log("Custom list doesn't exist!");

      //creating new lists
      const list = new List({
        name: customListName,
        items: defaultItem,
      });
      await list.save();
      res.redirect("/" + customListName);
    } else {
      //console.log("Custom list exists!");
      //show existing name
      res.render("list", {
        listTitle: foundList.name,
        newListItems: foundList.items,
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error fetching custom list.");
  }
});

app.post("/delete", async function (req, res) {
  const checkItemsId = req.body.checkbox;
  const listName = req.body.listname;

  try {
    if (listName === "Today") {
      await Item.findOneAndRemove({ _id: checkItemsId });
      res.redirect("/");
    } else {
      await List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: checkItemsId } } }
      );
      res.redirect("/" + listName);
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error processing the request.");
  }
});

// app.listen(3000, function() {
//   console.log("Server started on port 3000");
// });

app.listen(process.env.PORT || 3000, function () {
  console.log("server is live on 3000");
});
