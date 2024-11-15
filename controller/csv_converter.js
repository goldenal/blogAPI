const { SchoolsData } = require("./schools");
const fs = require('fs');
const path = require('path');

const { parse } = require('csv-parse');
const { stringify } = require('csv-stringify');


const convertFile = async (req, res) => {

    function csvToFormattedString(filePath, outputFile) {
        return new Promise((resolve, reject) => {
            const results = [];

            fs.createReadStream(filePath)
                .pipe(parse({
                    mapHeaders: ({ header }) => header.trim(),
                    mapValues: ({ value }) => value.trim(),
                    quote: '"',
                    escape: '"'
                }))
                .on('data', (row) => {
                    // console.log('Parsed Row:', row);
                    results.push(row);
                })
                .on('end', () => {

                    // Convert each row to the specified format
                    const formattedRows = results.map((row) => {

                        return `{
          id: ${row[0]},
          name: "${row[1]}",
          address: "${row[2]}",
          country: "${row[3]}"
        }`;
                    });

                    // Join each formatted row with a comma and newline
                    const outputString = `[\n  ${formattedRows.join(',\n  ')}\n]`;

                    // Write the output string to a .txt file
                    fs.writeFile(outputFile, outputString, (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(`Output written to ${outputFile}`);
                        }
                    });
                })
                .on('error', (error) => {
                    reject(error);
                });
        });
    }

    // Usage example
    csvToFormattedString('schools.csv', 'output.txt')
        .then((message) => {
            console.log(message);
        })
        .catch((error) => {
            console.error("Error:", error);
        });


    //    // Function to read CSV file and return promise with parsed data
    //     function readCSV(filePath, headers = true) {
    //         return new Promise((resolve, reject) => {
    //             const results = [];
    //             fs.createReadStream(filePath)
    //                 .pipe(parse({
    //                     columns: headers,
    //                     skip_empty_lines: true,
    //                     trim: true
    //                 }))
    //                 .on('data', (data) => results.push(data))
    //                 .on('end', () => resolve(results))
    //                 .on('error', reject);
    //         });
    //     }

    //     async function compareUniversities() {
    //         try {
    //             // Read both CSV files
    //             const csv1Data = await readCSV('schools.csv');
    //             const csv2Data = await readCSV('ne.csv');

    //             // Get all university names from csv1 (converted to lowercase for case-insensitive comparison)
    //             const universities1 = new Set(
    //                 csv1Data.map(row => row.name.toLowerCase())
    //             );

    //             // Filter universities from csv2 that don't exist in csv1
    //             const uniqueUniversities = csv2Data
    //                 .filter(row => row.University && row.University.trim()) // Remove empty entries
    //                 .filter(row => !universities1.has(row.University.toLowerCase()))
    //                 .map(row => ({ University: row.University.trim() }));

    //             // Write results to new file
    //             fs.writeFileSync(
    //                 'newfile.csv',
    //                 await new Promise((resolve, reject) => {
    //                     stringify(uniqueUniversities, {
    //                         header: true,
    //                         columns: ['University']
    //                     }, (err, output) => {
    //                         if (err) reject(err);
    //                         else resolve(output);
    //                     });
    //                 })
    //             );

    //             console.log(`Found ${uniqueUniversities.length} universities in csv2 that don't exist in csv1`);
    //             console.log("Results have been saved to 'newfile.csv'");

    //         } catch (error) {
    //             console.error('Error processing CSV files:', error.message);
    //         }
    //     }



    //      compareUniversities();



    //-------------------------------



    // // Create directory if it doesn't exist
    // const dirName = 'exported_data';
    // if (!fs.existsSync(dirName)) {
    //     fs.mkdirSync(dirName);
    // }

    // // Convert data to CSV format
    // const headers = Object.keys(SchoolsData[0]);
    // const csvRows = [
    //     headers.join(','), // Add headers as first row
    //     ...SchoolsData.map(row =>
    //         headers.map(header =>
    //             // Wrap values in quotes and escape existing quotes
    //             `"${String(row[header]).replace(/"/g, '""')}"`
    //         ).join(',')
    //     )
    // ];

    // // Join all rows with newlines
    // const csvContent = csvRows.join('\n');

    // // Write to file
    // const filePath = path.join(dirName, 'schools.csv');
    // fs.writeFileSync(filePath, csvContent);

    // console.log(`CSV file has been created at ${filePath}`);

};

module.exports = {
    convertFile


}