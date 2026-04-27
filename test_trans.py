from deep_translator import GoogleTranslator

try:
    translated = GoogleTranslator(source='auto', target='zh-CN').translate("This is a test of the translation system.")
    print("ZH:", translated)
    
    translated_pl = GoogleTranslator(source='auto', target='pl').translate("This is a test of the translation system.")
    print("PL:", translated_pl)
except Exception as e:
    print("Error:", e)
