import express from "express";
import axios from "axios";

const app = express();
const port = 3000;
const API_URL = "https://openlibrary.org/search.json?";
const defaultSlideData = [
  {
    title: "Find your next read.",
    author: "Search an author or interest.",
    path: "/images/Book.jpg",
  },
];

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// before any search terms are entered, the books carousel shows the default message
app.get("/", (req, res) => {
  res.render("index.ejs", defaultSlideData);
});

app.post("/submit", async (req, res) => {
  let search = "";
  let shortData = [];
  let booksToReccomend = [];
  // get user's input and create endpoint
  if (req.body.genre && !req.body.author) {
    search = `q=${req.body.genre.toLowerCase()}&language=eng`.replace(" ", "+");
  } else if (req.body.author && !req.body.genre) {
    search = `q=${req.body.author.toLowerCase()}&language=eng`.replace(
      " ",
      "+"
    );
  } else {
    search =
      `q=${req.body.author.toLowerCase()}&${req.body.genre.toLowerCase()}&language=eng`.replace(
        " ",
        "+"
      );
  }
  // basic openlibrary api search using endpoint created above
  try {
    let response = await axios.get(API_URL + search);
    let data = response.data.docs;
    // select 5 random entries from the top 25 results results
    for (let i = 0; i < 5; i++) {
      let randomIndex = Math.floor(Math.random() * 25);
      let chosenBook = data[randomIndex];
      shortData.push(chosenBook);
    }
  } catch (error) {
    // errors related to inital search terms
    console.log("Error fetching book data: " + error.message);
  }
  // use key from basic search results to get full info per book and search for covers
  shortData.forEach(async (element) => {
    let bookTitle = element.title;
    let bookAuthor = element.author_name;
    let imgPath = "";
    //   use the editions endpoint to get the isbn numbers for the books
    //   use the isbn numbers to construct a link to the cover images
    try {
      let editions = await axios.get(
        "https://openlibrary.org" + element.key + "/editions.json"
      );
      let isbn = editions.data.entries[0].isbn_13[0];
      imgPath = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
    } catch (error) {
      console.log("Error fetching cover image: " + error.message);
      // when no cover image is found, display the default book image
      imgPath = "/images/Book.jpg";
    }
    // populate the booksToReccomend array with book objects
    let bookData = { title: bookTitle, author: bookAuthor, path: imgPath };
    booksToReccomend.push(bookData);
    // when all 5 are stored, render index.ejs
    if (booksToReccomend.length == 5) {
      res.render("index.ejs", booksToReccomend);
    }
  });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
