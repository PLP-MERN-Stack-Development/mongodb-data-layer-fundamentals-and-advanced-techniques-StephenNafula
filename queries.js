// Importing MongoDB client
const { MongoClient } = require('mongodb');

// Defining MongoDB connection URI (local setup)
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

//Defining the database name
const dbName = 'plp_bookstore';

//Main async function to run queries
async function runQueries() {
  try {
    //Step 1: Connecting to MongoDB	
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Step 2: Accessing the 'plp_bookstore' database and 'books' collection 
    const db = client.db(dbName);
    const books = db.collection('books');


    // Write your queries below
   // First query: Finding all books in the "Fiction" genre
const fictionBooks = await books.find({ genre: "Fiction" }).toArray();
console.log("Books in the Fiction genre:");
fictionBooks.forEach(book => console.log(`- ${book.title} by ${book.author}`));

	// Second Query: Finding books published after 1950
const recentBooks = await books.find({ published_year: { $gt: 1950 } }).toArray();
console.log("\nBooks published after 1950:");
recentBooks.forEach(book => console.log(`- ${book.title} (${book.published_year})`));

     // Third Query: Finding books by a specific author
 
    // This query searches for all books written by a given author.
    // You can change the author's name in the filter as needed.
    const authorName = "George Orwell"; // Example author
    const authorBooks = await books.find({ author: authorName }).toArray();

    console.log(`\nBooks by ${authorName}:`);
    if (authorBooks.length === 0) {
      console.log("No books found for this author.");
    } else {
      authorBooks.forEach(book => 
        console.log(`- ${book.title} (${book.published_year})`)
      );
    }

    // Fouth Query: Updating the price of a specific book
    // This query locates a book by its title and updates its price.
    // We use the updateOne() method with the $set operator.
    const bookTitle = "The Hobbit";       // Book we want to update
    const newPrice = 16.99;               // New price value

    const updateResult = await books.updateOne(
      { title: bookTitle },               // Filter: find by title
      { $set: { price: newPrice } }       // Update: set a new price
    );

    if (updateResult.modifiedCount === 1) {
      console.log(`\nPrice of "${bookTitle}" updated to $${newPrice}.`);
    } else {
      console.log(`\nNo matching book found for title "${bookTitle}".`);
    }

    // To confirm, fetch and print the updated book:
    const updatedBook = await books.findOne({ title: bookTitle });
    console.log("Updated book info:", updatedBook);

    
    //Fifth Query: Deleting a book by its title
    // This query removes a single book document from the collection
    // based on the title field using the deleteOne() method.
    const deleteTitle = "Moby Dick"; // Change to any title you want to delete

    const deleteResult = await books.deleteOne({ title: deleteTitle });

    if (deleteResult.deletedCount === 1) {
      console.log(`\n"${deleteTitle}" has been deleted from the collection.`);
    } else {
      console.log(`\nNo book found with the title "${deleteTitle}".`);
    }

    // Sixth Query: Find books that are both in stock AND published after 2010
    // Uses the $and operator (though implicit AND works by default).
    // Filters books where in_stock = true and published_year > 2010.
    const modernInStockBooks = await books
      .find({ in_stock: true, published_year: { $gt: 2010 } })
      .toArray();

    console.log("\nBooks in stock and published after 2010:");
    if (modernInStockBooks.length === 0) {
      console.log("No books match this criteria.");
    } else {
      modernInStockBooks.forEach(book =>
        console.log(`- ${book.title} (${book.published_year})`)
      );
    }


    // Seventh Query: Projection - show only title, author, and price
    // The second argument in find() specifies which fields to include (1 = include, 0 = exclude).
    const projectedBooks = await books
      .find({}, { projection: { _id: 0, title: 1, author: 1, price: 1 } })
      .toArray();

    console.log("\nBooks (title, author, and price only):");
    projectedBooks.forEach(book =>
      console.log(`- ${book.title} by ${book.author} — $${book.price}`)
    );

    // Eighth Query: Sorting books by price
    // The sort() method arranges documents based on a specified field.
    // 1 = ascending (low to high), -1 = descending (high to low).

    // Sort ascending
    const booksSortedAsc = await books.find({}, { projection: { _id: 0, title: 1, price: 1 } })
                                     .sort({ price: 1 })
                                     .toArray();

    console.log("\nBooks sorted by price (ascending):");
    booksSortedAsc.forEach(book => console.log(`- ${book.title}: $${book.price}`));

    // Sort descending
    const booksSortedDesc = await books.find({}, { projection: { _id: 0, title: 1, price: 1 } })
                                      .sort({ price: -1 })
                                      .toArray();

    console.log("\nBooks sorted by price (descending):");
    booksSortedDesc.forEach(book => console.log(`- ${book.title}: $${book.price}`));


    // Nineth Query: Pagination using limit() and skip()
    // This simulates a "page view" of 5 books per page.
    // limit(5) restricts results to 5 documents, skip(n) skips over previous pages.
    
    const pageSize = 5; // number of books per page

    // Page 1
    const page1 = await books.find({}, { projection: { _id: 0, title: 1, author: 1 } })
                             .skip(0)
                             .limit(pageSize)
                             .toArray();

    console.log("\n Page 1 (Books 1–5):");
    page1.forEach(book => console.log(`- ${book.title} by ${book.author}`));

    // Page 2
    const page2 = await books.find({}, { projection: { _id: 0, title: 1, author: 1 } })
                             .skip(pageSize)
                             .limit(pageSize)
                             .toArray();

    console.log("\n Page 2 (Books 6–10):");
    page2.forEach(book => console.log(`- ${book.title} by ${book.author}`));


    // AGGREGATION 1: Averaging price of books by genre
    // The $group stage groups books by genre and calculates the average price.
    // The _id field represents the grouping key (genre in this case).

    const avgPriceByGenre = await books.aggregate([
      {
        $group: {
          _id: "$genre",                 // group by genre
          averagePrice: { $avg: "$price" }, // calculate average
          totalBooks: { $sum: 1 }          // count how many in each genre
        }
      },
      { $sort: { averagePrice: -1 } }     // optional: sort by highest average first
    ]).toArray();

    console.log("\n Average price of books by genre:");
    avgPriceByGenre.forEach(g =>
      console.log(`- ${g._id}: $${g.averagePrice.toFixed(2)} (${g.totalBooks} books)`)
    );


    // AGGREGATION 2: Finding the author with the most books
    // Step 1: Group all books by author and count how many books each one has.
    // Step 2: Sort them in descending order by count.
    // Step 3: Limit the result to the top author.

    const topAuthor = await books.aggregate([
      {
        $group: {
          _id: "$author",          // group by author name
          totalBooks: { $sum: 1 }  // count number of books per author
        }
      },
      { $sort: { totalBooks: -1 } },  // sort by book count (descending)
      { $limit: 1 }                   // take only the top author
    ]).toArray();

    console.log("\n Author with the most books:");
    if (topAuthor.length > 0) {
      const author = topAuthor[0];
      console.log(`- ${author._id} (${author.totalBooks} books)`);
    } else {
      console.log("No author data found.");
    }


    // AGGREGATION 3: Grouping books by publication decade
    // This pipeline groups books into decades (e.g., 1950s, 1980s)
    // and counts how many books were published in each decade.

    const booksByDecade = await books.aggregate([
      {
        // Step 1: Create a new field "decade" by rounding published_year down to nearest 10
        $addFields: {
          decade: {
            $concat: [
              { $toString: { $subtract: ["$published_year", { $mod: ["$published_year", 10] }] } },
              "s"
            ]
          }
        }
      },
      {
        // Step 2: Group by this new decade field
        $group: {
          _id: "$decade",
          count: { $sum: 1 } // Count how many books per decade
        }
      },
      { $sort: { _id: 1 } } // Step 3: Sort by decade
    ]).toArray();

    console.log("\n Books grouped by publication decade:");
    booksByDecade.forEach(d =>
      console.log(`- ${d._id}: ${d.count} books`)
    );


    // INDEXING: Improving search performance
    // Create an index on the 'title' field for faster searches
    const titleIndex = await books.createIndex({ title: 1 });
    console.log(`\n Created index on 'title' field: ${titleIndex}`);

    //  Create a compound index on 'author' and 'published_year'
    const compoundIndex = await books.createIndex({ author: 1, published_year: -1 });
    console.log(` Created compound index on 'author' and 'published_year': ${compoundIndex}`);

    // Use explain() to demonstrate performance before and after indexing
    console.log("\n Query performance with index:");
    const explainResult = await books.find({ title: "The Hobbit" }).explain("executionStats");
    console.log(`Execution time (ms): ${explainResult.executionStats.executionTimeMillis}`);
    console.log(`Documents examined: ${explainResult.executionStats.totalDocsExamined}`);

  } catch (err) {
    console.error(err);
  } finally {
	// Step 3: Closing the MongoDB connection
    await client.close();
    console.log('Connection closed');
  }
}

// Running the function
runQueries();
