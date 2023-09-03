# Require CMAKE 3.13 or higher
cmake_minimum_required(VERSION 3.13)

# Project name
set(GAMENAME {{lowercaseTitle}})
project(${GAMENAME})

# Build for C++17
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Where any include files are
include_directories(lib/junebug/include)
include_directories(lib/junebug/lib/SDL/include)
include_directories(lib/junebug/lib/GLEW/include)
include_directories(lib/junebug/lib/rapidjson/include)
include_directories(lib/junebug/lib/SDL_FontCache)

# Where any plugins are
if (NOT EMSCRIPTEN)
	include_directories(lib/junebug/plugins/discord)
endif()

if (WIN32)
	link_directories(lib/junebug/lib/GLEW/lib/win/x64)
	link_directories(lib/junebug/lib/SDL/lib/win/x64)
	link_directories(lib/junebug/plugins/discord/discord_game_sdk/lib/x86_64)
elseif(APPLE)
	link_directories(lib/junebug/lib/GLEW/lib/mac)
	link_directories(lib/junebug/lib/SDL/lib/mac)
	link_directories(lib/junebug/plugins/discord/discord_game_sdk/lib/x86_64)
elseif(UNIX)
	if (NOT EMSCRIPTEN)
		link_directories(lib/junebug/plugins/discord/discord_game_sdk/lib/x86_64)
	endif()
endif()

add_subdirectory(lib/junebug)

# Set any compiler-specific settings
if (WIN32)
	add_executable(${GAMENAME} src/main.cpp)

	set(CMAKE_CXX_FLAGS "/DWIN32 /D_WINDOWS /W3 /GR /EHsc /wd26812 /w34456 /w34457 /w34458 /w34459 /w35038 /we4715 /we4834")
	set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} /ignore:4099 /ignore:4075")
	
	file(GLOB_RECURSE MYDLLS "${PROJECT_SOURCE_DIR}/lib/junebug/lib/*.dll")
	foreach(CurrentDllFile IN LISTS MYDLLS)
		add_custom_command(TARGET ${GAMENAME}
			POST_BUILD
			COMMAND ${CMAKE_COMMAND} -E copy "${CurrentDllFile}" "${CMAKE_CURRENT_BINARY_DIR}/Debug"
		)
	endforeach()
    
	file(GLOB_RECURSE MYDLLS "${PROJECT_SOURCE_DIR}/lib/junebug/lib/*.lib")
	foreach(CurrentDllFile IN LISTS MYDLLS)
		add_custom_command(TARGET ${GAMENAME}
			POST_BUILD
			COMMAND ${CMAKE_COMMAND} -E copy "${CurrentDllFile}" "${CMAKE_CURRENT_BINARY_DIR}/Debug"
		)
	endforeach()
	
	add_custom_command(TARGET ${GAMENAME}
		POST_BUILD
		COMMAND ${CMAKE_COMMAND} -E copy_directory "${PROJECT_SOURCE_DIR}/assets" ${CMAKE_BINARY_DIR}/Debug/assets
	)

	target_link_libraries(${GAMENAME} junebug)

    set_target_properties(${GAMENAME}
    	PROPERTIES
        LINK_FLAGS_DEBUG "/SUBSYSTEM:CONSOLE"
        LINK_FLAGS_RELEASE "/SUBSYSTEM:windows /ENTRY:mainCRTStartup"
        LINK_FLAGS_RELWITHDEBINFO "/SUBSYSTEM:windows /ENTRY:mainCRTStartup"
        LINK_FLAGS_MINSIZEREL "/SUBSYSTEM:windows /ENTRY:mainCRTStartup"
    )
elseif(APPLE)
	add_executable(${GAMENAME} src/main.cpp)

	set(CMAKE_CXX_FLAGS "-Wall -Werror=return-type -Werror=unused-result -ftrivial-auto-var-init=pattern")
	find_library(COREFOUNDATION_LIBRARY CoreFoundation)
	find_library(COREGRAPHICS_LIBRARY CoreGraphics)
	find_library(COREAUDIO_LIBRARY CoreAudio)
	find_library(COREVIDEO_LIBRARY CoreVideo)
	find_library(AUDIOTOOLBOX_LIBRARY AudioToolbox)
	find_library(FORCEFEEDBACK_LIBRARY ForceFeedback)
	find_library(IOKIT_LIBRARY IOKit)
	find_library(APPKIT_LIBRARY AppKit)
	find_library(METAL_LIBRARY Metal)
	find_library(CARBON_LIBRARY Carbon)
	find_library(OPENGL_LIBRARY OpenGL)
	set(CMAKE_XCODE_ATTRIBUTE_GCC_GENERATE_DEBUGGING_SYMBOLS[variant=Debug] "YES")
	set(CMAKE_XCODE_ATTRIBUTE_GCC_GENERATE_DEBUGGING_SYMBOLS[variant=MinSizeRel] "NO")
	set(CMAKE_XCODE_ATTRIBUTE_GCC_GENERATE_DEBUGGING_SYMBOLS[variant=RelWithDebInfo] "YES")
	set(CMAKE_XCODE_ATTRIBUTE_GCC_GENERATE_DEBUGGING_SYMBOLS[variant=Release] "NO")

	target_link_libraries(${GAMENAME} SDL2 SDL2_image SDL2_mixer SDL2_ttf ogg vorbis vorbisfile GLEW ${COREFOUNDATION_LIBRARY} ${OPENGL_LIBRARY} ${COREGRAPHICS_LIBRARY} ${COREAUDIO_LIBRARY} ${AUDIOTOOLBOX_LIBRARY} ${COREVIDEO_LIBRARY} ${FORCEFEEDBACK_LIBRARY} ${IOKIT_LIBRARY} ${APPKIT_LIBRARY} ${METAL_LIBRARY} ${CARBON_LIBRARY})
	set_target_properties(
		${GAMENAME}
		PROPERTIES
		XCODE_ATTRIBUTE_CLANG_WARN_SUSPICIOUS_IMPLICIT_CONVERSION YES
		XCODE_ATTRIBUTE_GCC_WARN_SHADOW YES
		XCODE_ATTRIBUTE_GCC_WARN_ABOUT_RETURN_TYPE YES
		XCODE_ATTRIBUTE_GCC_WARN_SIGN_COMPARE YES
		XCODE_ATTRIBUTE_GCC_WARN_UNINITIALIZED_AUTOS YES
		XCODE_ATTRIBUTE_GCC_WARN_UNUSED_FUNCTION NO
	)

	get_cmake_property(is_multi GENERATOR_IS_MULTI_CONFIG)
	if (is_multi)
		set(COPY_DESTINATION "${CMAKE_CURRENT_BINARY_DIR}/Debug")
	else()
		set(COPY_DESTINATION "${CMAKE_CURRENT_BINARY_DIR}")
	endif()

	file(GLOB_RECURSE MYDLLS "${PROJECT_SOURCE_DIR}/lib/junebug/lib/*.dylib")
	foreach(CurrentDllFile IN LISTS MYDLLS)
		add_custom_command(TARGET ${GAMENAME}
			POST_BUILD
			COMMAND ${CMAKE_COMMAND} -E copy "${CurrentDllFile}" "${COPY_DESTINATION}"
			COMMENT "Copy dylib file to ${COPY_DESTINATION} directory" VERBATIM
		)
	endforeach()

	file(GLOB_RECURSE MYDLLS "${PROJECT_SOURCE_DIR}/lib/junebug/lib/*.so")
	foreach(CurrentDllFile IN LISTS MYDLLS)
		message(${CurrentDllFile})
		add_custom_command(TARGET ${GAMENAME}
			POST_BUILD
			COMMAND ${CMAKE_COMMAND} -E copy "${CurrentDllFile}" "${COPY_DESTINATION}"
			COMMENT "Copy dylib file to ${COPY_DESTINATION} directory" VERBATIM
		)
	endforeach()

	target_link_libraries(${GAMENAME} junebug)
	target_link_libraries(${GAMENAME} SDL2)
	
	file(COPY assets DESTINATION ${CMAKE_BINARY_DIR})
elseif (EMSCRIPTEN)
	set(USE_FLAGS "-s USE_SDL=2 -s USE_FREETYPE=1 -s USE_SDL_IMAGE=2 -s SDL2_IMAGE_FORMATS='[\"png\"]' -s USE_SDL_MIXER=2 -s USE_SDL_TTF=2")
	set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} ${USE_FLAGS}")
	set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${USE_FLAGS} -Wall -Wextra -std=c++17")
	set(CMAKE_EXECUTABLE_SUFFIX ".html")
	set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} ${USE_FLAGS} -sMIN_WEBGL_VERSION=2 -sTOTAL_MEMORY=1024MB --preload-file \"${PROJECT_SOURCE_DIR}/assets@/assets\" --shell-file \"${PROJECT_SOURCE_DIR}/lib/junebug/lib/Emscripten/shell_minimal.html\"")

	set(EXECUTABLE_OUTPUT_PATH ${CMAKE_SOURCE_DIR}/embuild)
	add_executable(${GAMENAME} src/main.cpp)

	target_link_libraries(${GAMENAME} junebug)
	target_link_libraries(${GAMENAME} SDL2)
else()
	add_executable(${GAMENAME} src/main.cpp)
	
	set_target_properties(${GAMENAME}
		PROPERTIES
		LINK_FLAGS_RELEASE "-mwindows"
	)

	target_link_libraries(${GAMENAME} junebug)
	target_link_libraries(${GAMENAME} SDL2)
	
	file(COPY assets DESTINATION ${CMAKE_BINARY_DIR})
endif()