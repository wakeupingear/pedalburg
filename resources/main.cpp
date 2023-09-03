#define SDL_MAIN_HANDLED

#include <junebug.h>

using namespace junebug;
using namespace std;

class {{vanityName}}Game : public Game
{
public :
    void LoadData(){
        // Load data here
    }
};

int main(int argc, char *argv[])
{
    {{vanityName}}Game game;
    game.Options().title = "{{title}}";
    return game.Run();
}