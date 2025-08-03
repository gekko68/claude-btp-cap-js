const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
  const { Books } = this.entities;
  const LOG = cds.log('bookshop-service');
    
    this.before('READ', 'Books', async (req) => {
      LOG.info('Reading books with query:', req.query);
    });

    this.after('READ', 'Books', (books, req) => {
      LOG.info(`Returned ${Array.isArray(books) ? books.length : 1} book(s)`);
      return books;
    });

    this.on('createBook', async (req) => {
      const { title, author, genre, price, stock } = req.data;
      
      LOG.info(`Creating new book: ${title} by ${author}`);
      
      try {
        const result = await INSERT.into(Books).entries({
          title,
          author,
          genre,
          price,
          stock
        });
        
        const bookId = result.lastID || result.insertId;
        LOG.info(`Successfully created book with ID: ${bookId}`);
        return await SELECT.one.from(Books).where({ ID: bookId });
        
      } catch (error) {
        LOG.error('Error creating book:', error);
        req.error(500, 'Failed to create book');
      }
    });

    this.on('getBooksByGenre', async (req) => {
      const { genre } = req.data;
      
      LOG.info(`Fetching books by genre: ${genre}`);
      
      try {
        const books = await SELECT.from(Books).where({ genre });
        LOG.info(`Found ${books.length} books in genre: ${genre}`);
        return books;
        
      } catch (error) {
        LOG.error('Error fetching books by genre:', error);
        req.error(500, 'Failed to fetch books');
      }
    });

  LOG.info('BookshopService initialized successfully');
});