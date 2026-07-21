# Research Note — Browser localStorage

## Source

- **Used source:** [Window: localStorage property — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- **Search keywords:** `MDN localStorage browser sessions getItem setItem removeItem`

## Georgian Summary

`localStorage` არის ბრაუზერის საცავი, რომელიც კონკრეტულ საიტს მონაცემების შენახვის საშუალებას აძლევს. მასში შენახული მონაცემები ბრაუზერის სესიების შემდეგაც რჩება და ავტომატურად არ იშლება. გასაღებებიც და მნიშვნელობებიც ტექსტური ფორმით ინახება, ამიტომ ობიექტების შესანახად პროექტში გამოიყენება JSON გარდაქმნა. `setItem()` ამატებს ან ცვლის მნიშვნელობას, `getItem()` კითხულობს მას, ხოლო `removeItem()` მხოლოდ არჩეულ გასაღებს შლის. საცავი დამოკიდებულია საიტის origin-ზე, ამიტომ HTTP და HTTPS მისამართებს ცალ-ცალკე მონაცემები აქვთ. ამ CRM-ში ეს ცოდნა გამოვიყენე მომხმარებლების, სესიის, კლიენტებისა და თემის ცალკე გასაღებებში უსაფრთხოდ სამართავად, თუმცა სენსიტიური პაროლების ასე შენახვა რეალურ პროდუქტში დაუშვებელია.
