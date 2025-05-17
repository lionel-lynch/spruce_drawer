const readline = require('node:readline');
const fs = require('node:fs');

// создаём объект для чтения пользовательского ввода с CLI
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

// функция считывает ввод количества этажей ёлки из консоли
const getLayersAmountInput = async () => {
    return new Promise((resolve) => {
        rl.question(`Введите количество этажей ёлки (или 0 для выхода): `, (input) => {
            try {
                if (input.trim() === '0') {
                    resolve(0);
                }

                const layersAmount = Number(input); // приводим введённое значение к int

                // проверяем что данные корректно приведены к int
                // 0 в данном случае будет означать не введенный ноль, а пустое значение
                // т.к. с помощью Number пустое значение приведётся к 0
                if (!Number.isInteger(layersAmount) || layersAmount === 0) { 
                    resolve(undefined);
                }

                resolve(layersAmount);
            } catch (err) {
                resolve(undefined);
            }
        });
    });
}

// функция считывает ввод пути к результирующему txt-файлу
const getOutputPath = async () => {
    return new Promise((resolve) => {
        rl.question(`Введите путь к txt-файлу для вывода (или 0 для выхода): `, (input) => {
            try {
                input = input.trim()

                if (input === '0') {
                    resolve('0');
                } else { // тут не очень красивая лесенка из if, пришлось нарисовать её из-за асинхронной команды fs.writeFile() ниже
                    
                    // забираем подстроку из последних 4-х символов 
                    // чтоб проверить верно ли задан формат выходного файла
                    const fileFormat = input.slice(-4);

                    // проверяем что введён корректный формат файла
                    if (fileFormat === '.txt') {
                        // fs.writeFile() создаст запрашиваемый файл, если его не существует в файловой системе
                        // если файл создастя -- мы убедимся что введён корректный путь
                        fs.writeFile(input, ``, (err) => {
                            if (err) {
                                resolve(undefined);
                            }
            
                            resolve(input);
                        });
                    } else {
                        resolve(undefined);
                    }
                }
            } catch (err) {
                resolve(undefined);
            }
        });
    });
}

const main = async () => {
    let layersAmount; // количество этажей ёлки
    while (true) { // организовываем цикличность ввода
        // получаем ввод количества этажей ёлки
        layersAmount = await getLayersAmountInput();

        // layersAmount будет либо int либо undefined
        // поэтому делаем такую лесенку if
        // здесь можно использовать switch, но я решил так :)
        if (layersAmount === 0) {
            console.log(`Введён 0, завершаем работу...`);
            process.exit();
        } 

        // если ввод корректен (я решил сделать ограничение в 500 этажей)
        if (layersAmount > 0 && layersAmount <= 500) {
            break;
        } 

        console.log(`Некорректный ввод`);
    }

    let outputFile; // путь к выходному файлу
    while (true) { // организовываем цикличность ввода
        // получаем введённый путь к выходному файлу
        outputFile = await getOutputPath();

        // getOutputPath() может вернуть '0', строку пути или undefined 
        // (сделал '0' строкой для единообразия -- функция возвращает строку)
        if (outputFile === '0') {
            console.log('Введён 0, завершаем работу...');
            process.exit();
        }
        
        // я бы лучше проверил тут на !outputFile и в случае истины сделал бы continue
        // так, мне кажется, надёжнее
        // но для единообразия с проверкой ввода этажей из предыдущего блока кода сделал как сделал
        if (outputFile) {
            break;
        }

        console.log('Некорректный ввод');
    }

    // верхний этаж ёлки будет нарисован в любом случае поэтому декрементируем переменную
    // чтоб заказанное количество этажей точно совпадало с фактическим количеством
    --layersAmount;

    // количество символов звёздочки (*) на первой вычисляемой строке (вычислять строки начнём с 3 "этажа" ёлки)
    // ориентироваться при вычислении отступов будем по символам звёздочки
    const firstLayerStarsLen = 5;
    const starsIncrement = 4; // количество добавляемых на каждом этаже звёздочек

    // вычисляем длину самого длинного этажа
    const biggestLayerLen = firstLayerStarsLen + (layersAmount * starsIncrement);

    // вычисляем количество пробелов, необходимых для отрисовки центра ёлки
    const offsetToMiddle = Array(Math.round(biggestLayerLen / 2));

    // в данный массив будем складывать строки вывода
    const output = [];

    // при join(' ') на массиве пустых значений итоговая строка 
    // будет иметь длину на 1 символ пробела меньше, 
    // чем длина массива на котором применялся join()
    // как раз то что нам нужно
    output.push(`${offsetToMiddle.join(' ')}W\n`);
    output.push(`${offsetToMiddle.join(' ')}*\n`);

    for (let i = 0; i < layersAmount; i++) {
        const lineLen = firstLayerStarsLen + (starsIncrement * i); // вычисляем длину очередного этажа
        const lineOffset = Array((offsetToMiddle.length - Math.floor(lineLen / 2))); // вычисляем сдвиг этажа
        let line = Array(lineLen + 1).join('*'); // формируем строку из звёздочек

        // в зависимости от того чётная или нечётная строка 
        // будем добавлять игрушку в начало или в конец строки
        if (i % 2 == 0) {
            line = '@' + line;
            lineOffset.length -= 1; // уменшьаем сдвиг строки на 1 пробел
        } else {
            line += '@';
        }

        // сохраняем очередной этаж ёлки для дальнейшего вывода
        output.push(`${lineOffset.join(' ')}${line}\n\n`);
    }

    // записываем вывод в файл
    fs.writeFile(outputFile, output.join(''), (err) => {
        rl.close(); // закрываем стрим пользовательского ввода

        if (err) {
            console.log(`Ошибка записи вывода в файл: ${err}\n\n`)
            console.log(`Завершаем работу скрипта...`);
            process.exit()
        }

        console.log(`Данные успешно записаны в файл: ${outputFile}`);
        
    })
}


main();
